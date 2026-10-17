import os
from pydantic_settings import BaseSettings


class Settings(BaseSettings):
    PROJECT_NAME: str = "IP Scanner Service"
    VERSION: str = "1.0.0"
    API_V1_STR: str = "/api/v1"
    PORT: int = 8018
    ENVIRONMENT: str = os.getenv("ENVIRONMENT", "development")
    DEBUG: bool = os.getenv("DEBUG", "True").lower() == "true"
    ALLOW_INTERNAL_SCAN: bool = os.getenv("ALLOW_INTERNAL_SCAN", "false").lower() == "true"
    SHODAN_API_KEY: str = os.getenv("SHODAN_API_KEY", "")
    VIRUSTOTAL_API_KEY: str = os.getenv("VIRUSTOTAL_API_KEY", "")
    MAX_CIDR_HOSTS: int = int(os.getenv("MAX_CIDR_HOSTS", "16"))
    USE_NMAP: bool = os.getenv("USE_NMAP", "true").lower() == "true"
    NMAP_PATH: str = os.getenv("NMAP_PATH", "")
    NMAP_TIMEOUT_SECONDS: int = int(os.getenv("NMAP_TIMEOUT_SECONDS", "320"))
    SCANNER_ASSUME_PRIVILEGED: bool = os.getenv("SCANNER_ASSUME_PRIVILEGED", "false").lower() == "true"

    POSTGRES_SERVER: str = os.getenv("POSTGRES_SERVER", "postgres")
    POSTGRES_PORT: str = os.getenv("POSTGRES_PORT", "5432")
    POSTGRES_USER: str = os.getenv("POSTGRES_USER", "postgres")
    POSTGRES_PASSWORD: str = os.getenv("POSTGRES_PASSWORD", "password")
    POSTGRES_DB: str = os.getenv("POSTGRES_DB", "risktrix_db")

    @property
    def database_url(self) -> str:
        return f"postgresql+asyncpg://{self.POSTGRES_USER}:{self.POSTGRES_PASSWORD}@{self.POSTGRES_SERVER}:{self.POSTGRES_PORT}/{self.POSTGRES_DB}"

    class Config:
        case_sensitive = True


settings = Settings()
