#!/bin/bash

# Define variables
EXTENSION_DIR="chrome-extension"
OUTPUT_DIR="public/downloads"
OUTPUT_FILE="$OUTPUT_DIR/facebook-memorial-extension.zip"

# Create output directory if it doesn't exist
mkdir -p $OUTPUT_DIR

# Remove previous zip if it exists
if [ -f "$OUTPUT_FILE" ]; then
  rm "$OUTPUT_FILE"
  echo "Removed previous extension zip file."
fi

# Create the zip file
echo "Creating new extension zip file..."
cd $EXTENSION_DIR && zip -r "../$OUTPUT_FILE" * && cd ..

# Check if the zip was created successfully
if [ -f "$OUTPUT_FILE" ]; then
  echo "Extension zip file created successfully at $OUTPUT_FILE"
  echo "File size: $(du -h $OUTPUT_FILE | cut -f1)"
else
  echo "Error: Failed to create extension zip file."
  exit 1
fi

echo "Done!" 