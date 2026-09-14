import os
import io
import uuid
import threading
from datetime import datetime
from fastapi import APIRouter, Depends, HTTPException, status, Query
from fastapi.responses import StreamingResponse, JSONResponse
from sqlalchemy.orm import Session
from sqlalchemy import or_

from app.database import get_db, SessionLocal
from app.models.submission import Submission
from app.models.activity import Activity
from app.models.period import Period
from app.models.user import User, UserRole
from pypdf import PdfMerger, PdfWriter, PdfReader

# ReportLab imports for generating PDFs
from reportlab.pdfgen import canvas
from reportlab.lib.pagesizes import letter
from reportlab.lib.units import inch
from reportlab.lib import colors

router = APIRouter()

# In-memory store for background portfolio tasks
_portfolio_tasks = {}

def create_cover_page(student_name: str, period_name: str) -> io.BytesIO:
    packet = io.BytesIO()
    c = canvas.Canvas(packet, pagesize=letter)
    width, height = letter
    
    # Background color block (optional)
    c.setFillColorRGB(0.95, 0.95, 0.95)
    c.rect(0, height - 2*inch, width, 2*inch, stroke=0, fill=1)
    
    # Institution / App Name
    c.setFillColorRGB(0, 0.4, 0.8) # Brand blue
    c.setFont("Helvetica-Bold", 24)
    c.drawCentredString(width / 2.0, height - 1.2*inch, "CompetencePort")
    
    c.setFillColorRGB(0, 0, 0)
    c.setFont("Helvetica", 14)
    c.drawCentredString(width / 2.0, height - 1.6*inch, "Plataforma de Evaluación por Competencias")
    
    # Title
    c.setFont("Helvetica-Bold", 32)
    c.drawCentredString(width / 2.0, height / 2.0 + 1*inch, "PORTAFOLIO DE EVIDENCIAS")
    
    # Details
    c.setFont("Helvetica", 16)
    c.drawCentredString(width / 2.0, height / 2.0 - 0.5*inch, f"Estudiante: {student_name}")
    
    if period_name:
        c.setFont("Helvetica-Bold", 14)
        c.drawCentredString(width / 2.0, height / 2.0 - 1.0*inch, f"Unidad Temática: {period_name}")
    else:
        c.setFont("Helvetica-Bold", 14)
        c.drawCentredString(width / 2.0, height / 2.0 - 1.0*inch, "Portafolio Integrado Final")
    
    # Date
    c.setFont("Helvetica", 12)
    c.setFillColorRGB(0.4, 0.4, 0.4)
    current_date = datetime.now().strftime("%d de %B de %Y")
    c.drawCentredString(width / 2.0, 1.5*inch, f"Generado el {current_date}")
    
    c.save()
    packet.seek(0)
    return packet

def create_toc_page(entries: list) -> io.BytesIO:
    """
    entries = [{"title": str, "page_start": int, "score": float}, ...]
    """
    packet = io.BytesIO()
    c = canvas.Canvas(packet, pagesize=letter)
    width, height = letter
    
    c.setFont("Helvetica-Bold", 24)
    c.drawString(1*inch, height - 1.5*inch, "Índice de Contenidos")
    
    c.line(1*inch, height - 1.6*inch, width - 1*inch, height - 1.6*inch)
    
    y_pos = height - 2.2*inch
    c.setFont("Helvetica", 12)
    
    for idx, entry in enumerate(entries, 1):
        if y_pos < 1*inch:
            c.showPage()
            y_pos = height - 1*inch
            c.setFont("Helvetica", 12)
            
        title = f"{idx}. {entry['title'][:50]}" + ("..." if len(entry['title']) > 50 else "")
        score_text = f" (Nota: {entry['score']})" if entry['score'] is not None else " (Sin calificar)"
        
        c.drawString(1*inch, y_pos, title + score_text)
        
        # Dots
        c.drawRightString(width - 1*inch, y_pos, f"Pág. {entry['page_start']}")
        y_pos -= 0.4 * inch
        
    c.save()
    packet.seek(0)
    return packet


def _generate_portfolio_background(task_id: str, student_id: int, mock: bool, period_id: int = None):
    """Runs portfolio generation in a background thread."""
    db = SessionLocal()
    try:
        student = db.query(User).filter(User.id == student_id, User.role == UserRole.STUDENT).first()
        if not student:
            _portfolio_tasks[task_id]["status"] = "error"
            _portfolio_tasks[task_id]["error"] = f"Estudiante con ID {student_id} no encontrado."
            return

        query = db.query(Submission).join(Activity).filter(
            Submission.student_id == student_id,
            Submission.score.isnot(None)
        )
        
        period_name = None
        if period_id:
            query = query.filter(Activity.period_id == period_id)
            period = db.query(Period).filter(Period.id == period_id).first()
            if period:
                period_name = period.name

        submissions = query.all()

        if not submissions:
            _portfolio_tasks[task_id]["status"] = "error"
            _portfolio_tasks[task_id]["error"] = "El estudiante no tiene entregas calificadas en el periodo seleccionado."
            return

        # 1. Analyze pages for TOC
        toc_entries = []
        pdf_streams = []
        
        # TOC and Cover count as initial pages. 
        # Actually Cover is 1, TOC is 1 (assuming TOC fits on 1 page for simplicity)
        current_page = 3 
        
        for sub in submissions:
            sub_stream = None
            page_count = 0
            if os.path.exists(sub.file_path):
                try:
                    with open(sub.file_path, "rb") as f:
                        reader = PdfReader(f)
                        page_count = len(reader.pages)
                        sub_stream = io.BytesIO(f.read())
                except Exception:
                    pass
            elif mock:
                writer = PdfWriter()
                writer.add_blank_page(width=612, height=792)
                temp_pdf = io.BytesIO()
                writer.write(temp_pdf)
                temp_pdf.seek(0)
                page_count = 1
                sub_stream = temp_pdf
            
            if sub_stream and page_count > 0:
                toc_entries.append({
                    "title": sub.activity.title,
                    "score": sub.score,
                    "page_start": current_page
                })
                pdf_streams.append(sub_stream)
                current_page += page_count

        if not pdf_streams:
            _portfolio_tasks[task_id]["status"] = "error"
            _portfolio_tasks[task_id]["error"] = "No se encontraron archivos PDF legibles."
            return

        # 2. Generate Cover and TOC
        cover_stream = create_cover_page(student.name, period_name)
        toc_stream = create_toc_page(toc_entries)

        # 3. Merge everything
        merger = PdfMerger()
        merger.append(cover_stream)
        merger.append(toc_stream)
        for s in pdf_streams:
            s.seek(0)
            merger.append(s)

        output = io.BytesIO()
        merger.write(output)
        merger.close()
        output.seek(0)

        _portfolio_tasks[task_id]["data"] = output.getvalue()
        _portfolio_tasks[task_id]["status"] = "ready"

    except Exception as e:
        _portfolio_tasks[task_id]["status"] = "error"
        _portfolio_tasks[task_id]["error"] = f"Error al fusionar PDFs: {str(e)}"
    finally:
        db.close()


@router.post("/generate/{student_id}")
def generate_portfolio(
    student_id: int,
    period_id: int = Query(None, description="ID del periodo/unidad (opcional)"),
    mock: bool = Query(False, description="Simula archivos en blanco si no existen"),
    db: Session = Depends(get_db)
):
    """
    Inicia la generación del portafolio en segundo plano.
    """
    task_id = str(uuid.uuid4())
    filename = f"Portafolio_Evidencias_{student_id}"
    if period_id:
        filename += f"_Unidad_{period_id}"
    filename += ".pdf"

    _portfolio_tasks[task_id] = {
        "status": "pending",
        "data": None,
        "filename": filename,
        "error": None
    }

    thread = threading.Thread(
        target=_generate_portfolio_background,
        args=(task_id, student_id, mock, period_id),
        daemon=True
    )
    thread.start()

    return JSONResponse(content={"task_id": task_id, "status": "pending"})


@router.get("/status/{task_id}")
def get_portfolio_status(task_id: str):
    task = _portfolio_tasks.get(task_id)
    if not task:
        raise HTTPException(status_code=404, detail="Tarea no encontrada.")
    return JSONResponse(content={
        "task_id": task_id,
        "status": task["status"],
        "error": task.get("error")
    })


@router.get("/download/{task_id}")
def download_portfolio(task_id: str):
    task = _portfolio_tasks.get(task_id)
    if not task:
        raise HTTPException(status_code=404, detail="Tarea no encontrada.")
    if task["status"] != "ready":
        raise HTTPException(status_code=400, detail="El portafolio aún no está listo.")

    output = io.BytesIO(task["data"])
    del _portfolio_tasks[task_id]

    return StreamingResponse(
        output,
        media_type="application/pdf",
        headers={
            "Content-Disposition": f"attachment; filename={task['filename']}",
            "Access-Control-Expose-Headers": "Content-Disposition"
        }
    )
