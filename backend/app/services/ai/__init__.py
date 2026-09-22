"""
AI Services package for AEGIS: Local LLM, Forensic Dossier Generation & Officer Copilot.
"""
from .local_llm import generate_officer_dossier, copilot_chat, get_llm_health

__all__ = ["generate_officer_dossier", "copilot_chat", "get_llm_health"]
