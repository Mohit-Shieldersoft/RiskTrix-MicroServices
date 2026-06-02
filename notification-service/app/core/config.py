from pydantic_settings import BaseSettings
from pydantic import Field


class Settings(BaseSettings):
    smtp_host: str = Field(default="smtp.gmail.com", alias="SMTP_HOST")
    smtp_port: int = Field(default=587, alias="SMTP_PORT")
    smtp_user: str = Field(default="", alias="SMTP_USER")
    smtp_password: str = Field(default="", alias="SMTP_PASSWORD")
    smtp_from: str = Field(default="noreply@risktrix.com", alias="SMTP_FROM")
    smtp_tls: bool = Field(default=True, alias="SMTP_TLS")
    port: int = Field(default=8006, alias="PORT")

    model_config = {"env_file": ".env", "populate_by_name": True}


settings = Settings()
