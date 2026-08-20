from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    model_config = SettingsConfigDict(env_file=".env", extra="ignore")

    database_url: str
    supabase_url: str = ""
    supabase_anon_key: str = ""
    supabase_service_role_key: str = ""
    frontend_origin: str = "http://localhost:5173"

    smtp_host: str = ""
    smtp_port: int = 587
    smtp_user: str = ""
    smtp_password: str = ""
    smtp_from: str = "PortalContabil.cloud <nao-responda@portalcontabil.cloud>"

    # E-mail que, ao logar sem ter linha em usuarios_portal, e promovido
    # automaticamente a master (bootstrap de recuperacao — ver
    # app/modules/admin/router.py:_ensure_admin_escritorio/me).
    master_seed_email: str = ""


settings = Settings()
