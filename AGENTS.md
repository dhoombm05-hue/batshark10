# Project architecture
- Document organization uses persisted `document_folders` parent links and `documents.folder_id`; existing business/section metadata remains intact so older files remain accessible.
- Browser-created documents are generated as real typed files and saved through the same Cloud storage and metadata path as imports; PDF pages render Arabic through canvas to preserve shaping.