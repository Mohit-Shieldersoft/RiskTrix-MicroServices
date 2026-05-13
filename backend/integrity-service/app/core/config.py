from pydantic_settings import BaseSettings

class Settings(BaseSettings):
    app_name: str = "Integrity Service"
    port: int = 8012
    environment: str = "development"
    postgres_server: str = "postgres"
    postgres_port: int = 5432
    postgres_user: str = "postgres"
    postgres_password: str = "password"
    postgres_db: str = "risktrix_db"
    database_url: str = "postgresql+asyncpg://postgres:password@postgres:5432/risktrix_db"
    redis_url: str = "redis://redis:6379"
    secret_key: str = "your-super-secret-key-change-in-production"

    class Config:
        env_file = ".env"

settings = Settings()