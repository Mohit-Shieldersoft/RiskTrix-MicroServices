from pydantic_settings import BaseSettings
from pydantic import Field


class Settings(BaseSettings):
    upload_dir: str = Field(default="uploads", alias="UPLOAD_DIR")
    max_file_size_mb: int = Field(default=20, alias="MAX_FILE_SIZE_MB")
    port: int = Field(default=8008, alias="PORT")

    model_config = {"env_file": ".env", "populate_by_name": True}

    @property
    def max_file_size_bytes(self) -> int:
        return self.max_file_size_mb * 1024 * 1024


settings = Settings()
