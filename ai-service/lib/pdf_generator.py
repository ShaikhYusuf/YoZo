"""
YoZo AI Service — PDF Generator Module

Converts Markdown lesson notes to a styled, branded A4 PDF using WeasyPrint.
Handles image embedding, page numbering, and professional typography.
"""

import logging
import os

import markdown as md_lib  # type: ignore

logger = logging.getLogger(__name__)

PDF_OUTPUT_DIR = os.getenv("PDF_OUTPUT_DIR", "./generated_pdfs")

# ───────────────────── PDF CSS Theme ─────────────────────

NOTES_CSS = """
@import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;600;700&display=swap');

body {
    font-family: 'Inter', Arial, sans-serif;
    font-size: 12pt;
    line-height: 1.6;
    color: #1a1a2e;
    margin: 0;
    padding: 0;
}

h1 {
    color: #6c63ff;
    font-size: 22pt;
    border-bottom: 3px solid #6c63ff;
    padding-bottom: 8px;
    margin-top: 0;
}

h2 {
    color: #3f3d56;
    font-size: 16pt;
    margin-top: 24pt;
    border-bottom: 1px solid #e0e0e0;
    padding-bottom: 4px;
}

h3 {
    color: #6c63ff;
    font-size: 13pt;
    margin-top: 16pt;
}

p { margin: 6pt 0; }

img {
    max-width: 100%;
    border-radius: 8px;
    margin: 10pt 0;
}

.diagram-caption, .image-caption {
    font-style: italic;
    color: #666;
    font-size: 10pt;
    text-align: center;
    margin-top: 4pt;
}

code {
    background: #f0f0f5;
    padding: 2px 6px;
    border-radius: 4px;
    font-size: 10pt;
    font-family: 'Courier New', monospace;
}

pre {
    background: #f8f8fc;
    padding: 12pt;
    border-radius: 6px;
    overflow-x: auto;
    font-size: 10pt;
}

ul, ol { padding-left: 20pt; }

li { margin: 3pt 0; }

blockquote {
    border-left: 4px solid #6c63ff;
    padding-left: 12pt;
    color: #555;
    font-style: italic;
    margin: 10pt 0;
}

a {
    color: #6c63ff;
    text-decoration: underline;
}

table {
    border-collapse: collapse;
    width: 100%;
    margin: 10pt 0;
}

th, td {
    border: 1px solid #ddd;
    padding: 6pt 10pt;
    text-align: left;
}

th {
    background: #6c63ff;
    color: white;
    font-weight: 600;
}

.video-link {
    display: block;
    background: #f8f8fc;
    border: 1px solid #e0e0e0;
    border-radius: 8px;
    padding: 8pt 12pt;
    margin: 6pt 0;
    text-decoration: none;
    color: #1a1a2e;
}

.video-link:hover {
    background: #efefff;
}

.footer {
    text-align: center;
    font-size: 9pt;
    color: #888;
    margin-top: 30pt;
    padding-top: 8pt;
    border-top: 1px solid #e0e0e0;
}

@page {
    size: A4;
    margin: 2cm;
    @frame footer {
        -pdf-frame-content: footer_content;
        bottom: 1cm;
        margin-left: 2cm;
        margin-right: 2cm;
        height: 1cm;
    }
}
"""


def generate_pdf(markdown_text: str, filename: str) -> str:
    """
    Convert Markdown text to a styled PDF file.

    Args:
        markdown_text: The full Markdown content to convert.
        filename: Base filename (without extension) for the output PDF.

    Returns:
        Absolute path to the generated PDF file.
    """
    try:
        from xhtml2pdf import pisa  # type: ignore
    except ImportError:
        logger.error(
            "xhtml2pdf is not installed. Install it with: pip install xhtml2pdf"
        )
        raise RuntimeError(
            "xhtml2pdf is required for PDF generation. "
            "Run: pip install xhtml2pdf"
        )

    os.makedirs(PDF_OUTPUT_DIR, exist_ok=True)
    filepath = os.path.join(PDF_OUTPUT_DIR, f"{filename}.pdf")

    # Convert Markdown → HTML
    html_body = md_lib.markdown(
        markdown_text,
        extensions=["tables", "fenced_code", "toc", "nl2br"],
    )

    full_html = f"""<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <style>{NOTES_CSS}</style>
</head>
<body>
    <div id="footer_content" class="footer">
        YoZo Learning Platform &bull; Page <pdf:pagenumber/>
    </div>
    {html_body}
</body>
</html>"""

    try:
        with open(filepath, "w+b") as result_file:
            pisa_status = pisa.CreatePDF(full_html, dest=result_file)
            if pisa_status.err:
                raise Exception(f"xhtml2pdf error: {pisa_status.err}")
        
        abs_path = os.path.abspath(filepath)
        logger.info(f"PDF generated: {abs_path}")
        return abs_path
    except Exception as e:
        logger.error(f"PDF generation failed: {e}")
        raise
