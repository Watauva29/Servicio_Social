import os
import shutil
from fastapi import UploadFile

# En un entorno real, esta clase usaría boto3 para conectarse a un bucket S3.
# Por ahora, guarda localmente y retorna la URL estática.
class StorageService:
    def __init__(self):
        self.upload_dir = "uploads/profiles"
        os.makedirs(self.upload_dir, exist_ok=True)
        # Mock de configuración S3
        self.use_s3 = os.getenv("USE_S3", "false").lower() == "true"
        self.s3_bucket = os.getenv("S3_BUCKET_NAME", "my-app-bucket")

    def save_file(self, file: UploadFile, filename: str) -> str:
        """
        Guarda el archivo y retorna la URL donde estará disponible.
        """
        if self.use_s3:
            # Lógica para subir a S3 (ej. con boto3)
            # s3.upload_fileobj(file.file, self.s3_bucket, f"profiles/{filename}")
            # return f"https://{self.s3_bucket}.s3.amazonaws.com/profiles/{filename}"
            pass
        
        # Almacenamiento local (MVP)
        file_path = os.path.join(self.upload_dir, filename)
        with open(file_path, "wb") as buffer:
            shutil.copyfileobj(file.file, buffer)
        
        # Retorna la ruta accesible públicamente a través de FastAPI StaticFiles
        return f"/uploads/profiles/{filename}"

storage_service = StorageService()
