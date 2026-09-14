from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
import os
from app.api.api import api_router
from app.database import engine, SessionLocal
from app.models import Base, User, UserRole, Period, Activity, Submission

def seed_db():
    db = SessionLocal()
    try:
        from app.models.schedule import ScheduleItem
        import datetime

        # Check if database has users
        if db.query(User).count() == 0:
            print("No users found. Seeding database...")
            # Seed users
            admin = User(name="Dr. Admin", email="admin@school.edu", password_hash="admin123", role=UserRole.ADMIN)
            teacher = User(name="Dr. Alejandro Pérez", email="alejandro@school.edu", password_hash="docente123", role=UserRole.TEACHER)
            assistant = User(name="Ing. Sofía Lara", email="sofia@school.edu", password_hash="asistente123", role=UserRole.ASSISTANT)
            s1 = User(name="Uriel Hernández", email="uriel@school.edu", password_hash="alumno123", role=UserRole.STUDENT, group_name="Grupo A")
            s2 = User(name="María Domínguez", email="maria@school.edu", password_hash="alumno123", role=UserRole.STUDENT, group_name="Grupo B")
            s3 = User(name="Alejandro Ruiz", email="alejandro.r@school.edu", password_hash="alumno123", role=UserRole.STUDENT, group_name="Grupo C")
            db.add_all([admin, teacher, assistant, s1, s2, s3])
            db.commit()
            
            # Seed some periods
            p1 = Period(
                name="Competencia C1 - Algoritmos y Datos",
                description="Fundamentos de lógica algorítmica y estructuras de datos.",
                start_date=datetime.date(2026, 2, 1),
                end_date=datetime.date(2026, 3, 30)
            )
            p2 = Period(
                name="Competencia C2 - Programación Web",
                description="Desarrollo backend y frontend con frameworks modernos.",
                start_date=datetime.date(2026, 4, 1),
                end_date=datetime.date(2026, 5, 30)
            )
            p3 = Period(
                name="Competencia C3 - Sistemas Distribuidos",
                description="Gestión de servicios en la nube y dockerización.",
                start_date=datetime.date(2026, 6, 1),
                end_date=datetime.date(2026, 7, 30)
            )
            db.add_all([p1, p2, p3])
            db.commit()
            
            # Seed activities for Period 1 (Algoritmos y Datos) - Completed
            a1 = Activity(title="Mapa Mental: Estructuras de Datos Lineales", description="Realizar un mapa mental con pilas, colas, listas enlazadas simples y dobles.", max_score=10.0, period=p1, due_date=datetime.date(2026, 3, 1))
            a2 = Activity(title="Práctica de Laboratorio 1: Algoritmos de Búsqueda", description="Implementar búsquedas binarias, secuenciales e interpoladas sobre arreglos ordenados.", max_score=10.0, period=p1, due_date=datetime.date(2026, 3, 10))
            a3 = Activity(title="Reporte Técnico: Complejidad Computacional O(n)", description="Analizar y documentar el costo temporal de algoritmos iterativos vs recursivos.", max_score=10.0, period=p1, due_date=datetime.date(2026, 3, 20))
            a4 = Activity(title="Evaluación Teórica: Competencia C1", description="Cuestionario integral presencial sobre análisis asintótico de algoritmos.", max_score=10.0, period=p1, due_date=datetime.date(2026, 3, 28))
            
            # Seed activities for Period 2 (Programación Web) - In progress, some due soon
            a5 = Activity(title="Proyecto Web Integrador: Backend con FastAPI", description="Creación de endpoints CRUD, validaciones con Pydantic e integración de base de datos.", max_score=10.0, period=p2, due_date=datetime.date(2026, 6, 25))
            a6 = Activity(title="Maquetación UI: Dashboard Responsivo", description="Desarrollar vistas usando CSS moderno y React. Incorporar interactividad y animaciones.", max_score=10.0, period=p2, due_date=datetime.date(2026, 6, 28))
            a7 = Activity(title="Reporte de Práctica: Consumo de APIs y Axios", description="Configurar interceptores en Axios y gestionar estados de carga, error y datos en React.", max_score=10.0, period=p2, due_date=datetime.date(2026, 7, 5))
            
            # Seed activities for Period 3 (Sistemas Distribuidos) - Upcoming
            a8 = Activity(title="Laboratorio Docker Compose", description="Levantar un entorno local multi-contenedor (db, backend, frontend) con volúmenes persistentes.", max_score=10.0, period=p3, due_date=datetime.date(2026, 7, 15))
            a9 = Activity(title="Orquestación de Microservicios", description="Configurar balanceadores de carga y endpoints de monitoreo de salud para servicios en la nube.", max_score=10.0, period=p3, due_date=datetime.date(2026, 7, 25))
            
            db.add_all([a1, a2, a3, a4, a5, a6, a7, a8, a9])
            db.commit()
            
            # Seed submissions (for student Uriel, to make portfolio generation possible out of the box)
            sub1 = Submission(student=s1, activity=a1, file_path="uploads/sub1.pdf", score=9.5, feedback="Excelente trabajo")
            sub2 = Submission(student=s1, activity=a2, file_path="uploads/sub2.pdf", score=10.0, feedback="Código muy limpio")
            db.add_all([sub1, sub2])
            db.commit()

            # Seed schedule items
            c1 = ScheduleItem(teacher_id=teacher.id, title="Programación Web - Grupo A", type="class", day_of_week="Lunes", start_time="08:00", end_time="10:00", location="Aula 104")
            c2 = ScheduleItem(teacher_id=teacher.id, title="Estructuras de Datos - Grupo B", type="class", day_of_week="Martes", start_time="10:00", end_time="12:00", location="Aula 102")
            c3 = ScheduleItem(teacher_id=teacher.id, title="Sistemas Distribuidos - Grupo C", type="class", day_of_week="Miércoles", start_time="12:00", end_time="14:00", location="Laboratorio 3")
            j1 = ScheduleItem(teacher_id=teacher.id, title="Reunión General de Academia", type="meeting", date=datetime.date.today(), start_time="15:00", end_time="16:00", location="Sala de Profesores")
            db.add_all([c1, c2, c3, j1])
            db.commit()

            print("Database seeded successfully!")
    except Exception as e:
        print(f"Error seeding DB: {e}")
    finally:
        db.close()


app = FastAPI(
    title="Plataforma de Evaluación por Competencias y Portafolios",
    description="Backend API en FastAPI con base de datos PostgreSQL y soporte para fusión de PDF",
    version="1.0.0"
)

# Configuración de CORS
origins = [
    "http://localhost:5173",
    "http://127.0.0.1:5173",
    "http://localhost:3000",
    "http://127.0.0.1:3000",
]

app.add_middleware(
    CORSMiddleware,
    allow_origins=origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Asegurar que el directorio de uploads/profiles exista
os.makedirs("uploads/profiles", exist_ok=True)

app.mount("/uploads", StaticFiles(directory="uploads"), name="uploads")

# Incluir las rutas de la API bajo el prefijo /api
app.include_router(api_router, prefix="/api")

@app.on_event("startup")
def on_startup():
    print("Initializing database...")
    Base.metadata.create_all(bind=engine)
    seed_db()

@app.get("/")
def read_root():
    return {
        "message": "Bienvenido al Backend de la Plataforma de Evaluación por Competencias y Portafolios",
        "docs_url": "/docs"
    }
