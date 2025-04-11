FROM python:3.11-slim

# Set environment variables
ENV PYTHONDONTWRITEBYTECODE=1 \
    PYTHONUNBUFFERED=1 \
    PYTHONPATH=/app

# Create a non-root user
RUN adduser --disabled-password --gecos "" appuser

# Set working directory
WORKDIR /app

# Install system dependencies
RUN apt-get update \
    && apt-get install -y --no-install-recommends gcc libpq-dev \
    && apt-get clean \
    && rm -rf /var/lib/apt/lists/*

# Copy requirements file and install dependencies
COPY ./api/requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

# Copy application code
COPY ./api/*.py ./

# Change ownership to non-root user
RUN chown -R appuser:appuser /app

# Switch to non-root user
USER appuser

# Expose port
EXPOSE 8888

# Run the application with uvicorn
CMD ["uvicorn", "main:app", "--host", "0.0.0.0", "--port", "8888"]