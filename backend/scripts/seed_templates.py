from __future__ import annotations

from uuid import uuid4

from models.document_template import DocumentTemplateCreate, TemplateField
from services.template_service import TemplateService


def run() -> None:
    service = TemplateService()

    fir_template = DocumentTemplateCreate(
        name="FIR - Theft",
        description="Standard template for filing a theft FIR",
        category="fir",
        version="1.0.0",
        fields=[
            TemplateField(name="complainant_name", label="Complainant Name", type="text", is_pii=True),
            TemplateField(name="father_name", label="Father/Husband Name", type="text", is_pii=True),
            TemplateField(name="address", label="Address", type="textarea", is_pii=True),
            TemplateField(name="incident_date", label="Incident Date", type="date"),
            TemplateField(name="incident_place", label="Incident Place", type="text"),
            TemplateField(name="incident_details", label="Incident Details", type="textarea"),
        ],
        template_text=(
            "FIRST INFORMATION REPORT\n\n"
            "Date: {{ now().strftime('%Y-%m-%d') }}\n"
            "To,\nThe Station House Officer\n"
            "Subject: Report regarding theft incident\n\n"
            "I, {{ complainant_name }}, child of {{ father_name }}, resident of {{ address }},\n"
            "wish to report that on {{ incident_date }} at {{ incident_place }}, the following incident occurred:\n"
            "{{ incident_details }}\n\n"
            "I request you to kindly register this complaint and take the necessary legal action.\n\n"
            "Sincerely,\n{{ complainant_name }}"
        ),
    )

    notice_template = DocumentTemplateCreate(
        name="Notice to Employer",
        description="Notice template to employer for pending dues or grievances",
        category="notice",
        version="1.0.0",
        fields=[
            TemplateField(name="employee_name", label="Employee Name", type="text", is_pii=True),
            TemplateField(name="employer_name", label="Employer Name", type="text"),
            TemplateField(name="employment_start_date", label="Employment Start Date", type="date"),
            TemplateField(name="issue_description", label="Issue Description", type="textarea"),
            TemplateField(name="requested_action", label="Requested Action", type="textarea"),
        ],
        template_text=(
            "FORMAL NOTICE\n\n"
            "Date: {{ now().strftime('%Y-%m-%d') }}\n"
            "To, {{ employer_name }}\n\n"
            "I, {{ employee_name }}, employed since {{ employment_start_date }}, wish to bring the following to your attention:\n"
            "{{ issue_description }}\n\n"
            "I request that you take the following action within 7 days of receiving this notice:\n"
            "{{ requested_action }}\n\n"
            "Sincerely,\n{{ employee_name }}"
        ),
    )

    for template in (fir_template, notice_template):
        existing = [t for t in service.list_templates() if t.name == template.name]
        if existing:
            print(f"Template already exists: {template.name}")
            continue
        created = service.create_template(template)
        print(f"Seeded template: {created.name} ({created.id})")


if __name__ == "__main__":
    run()
