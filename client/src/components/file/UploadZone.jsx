import { useRef, useState } from "react";
import { filesApi } from "../../api/files.js";

const MAX_SIZE = 10 * 1024 * 1024;

const ALLOWED_TYPES = [
  "application/pdf",
  "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
  "image/png",
  "image/jpeg",
];

export default function UploadZone({
  accessToken,
  onUploadComplete,
}) {
  const inputRef = useRef(null);

  const [dragging, setDragging] = useState(false);
  const [uploads, setUploads] = useState([]);

  function validateFile(file) {
    if (!ALLOWED_TYPES.includes(file.type)) {
      return "Only PDF, DOCX, PNG and JPG files are allowed.";
    }

    if (file.size > MAX_SIZE) {
      return "File size cannot exceed 10 MB.";
    }

    return null;
  }

  async function uploadFile(file) {
    const validationError = validateFile(file);

    if (validationError) {
      alert(validationError);
      return;
    }

    const uploadId =
      `${Date.now()}-${Math.random()}`;

    setUploads((current) => [
      ...current,
      {
        id: uploadId,
        name: file.name,
        progress: 0,
        status: "uploading",
      },
    ]);

    try {
      const response = await filesApi.upload(
        accessToken,
        file,
        (progress) => {
          setUploads((current) =>
            current.map((upload) =>
              upload.id === uploadId
                ? {
                    ...upload,
                    progress,
                  }
                : upload
            )
          );
        }
      );

      const uploadedFile = {
        _id: response.data.fileId,
        name: response.data.name,
        size: file.size,
        type: file.type,
        status: "pending",
      };

      setUploads((current) =>
        current.map((upload) =>
          upload.id === uploadId
            ? {
                ...upload,
                progress: 100,
                status: "pending",
                fileId: response.data.fileId,
              }
            : upload
        )
      );

      onUploadComplete?.(uploadedFile);
    } catch (error) {
      console.error("Upload failed:", error);

      setUploads((current) =>
        current.map((upload) =>
          upload.id === uploadId
            ? {
                ...upload,
                status: "failed",
              }
            : upload
        )
      );
    }
  }

  function handleFiles(fileList) {
    const files = Array.from(fileList);

    files.forEach(uploadFile);
  }

  function handleDrop(event) {
    event.preventDefault();

    setDragging(false);

    handleFiles(event.dataTransfer.files);
  }

  return (
    <div>
      <div
        className={`upload-zone ${
          dragging ? "dragging" : ""
        }`}
        onDragOver={(event) => {
          event.preventDefault();
          setDragging(true);
        }}
        onDragLeave={() => {
          setDragging(false);
        }}
        onDrop={handleDrop}
        onClick={() => inputRef.current?.click()}
      >
        <input
          ref={inputRef}
          type="file"
          hidden
          multiple
          accept=".pdf,.docx,.png,.jpg,.jpeg"
          onChange={(event) => {
            handleFiles(event.target.files);
            event.target.value = "";
          }}
        />

        <div className="upload-icon">
          ↑
        </div>

        <h3 className="drag-and-drop">
          Drag & drop files here
        </h3>

        <p>
          or click to browse
        </p>

        <small>
          PDF, DOCX, PNG, JPG · Maximum 10 MB
        </small>
      </div>

      {uploads.length > 0 && (
        <div className="upload-list">
          {uploads.map((upload) => (
            <div
              className="upload-item"
              key={upload.id}
            >
              <div>
                <strong>
                  {upload.name}
                </strong>

                <div className="progress">
                  <div
                    className="progress-bar"
                    style={{
                      width: `${upload.progress}%`,
                    }}
                  />
                </div>
              </div>

              <span>
                {upload.status === "uploading"
                  ? `${upload.progress}%`
                  : upload.status}
              </span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}