import FileStatusBadge from "./FileStatusBadge.jsx";
import FileThumbnail from "./FileThumbnail.jsx";
import api from "../../api/client.js";
function formatSize(bytes) {
  if (bytes < 1024) {
    return `${bytes} B`;
  }

  if (bytes < 1024 * 1024) {
    return `${(bytes / 1024).toFixed(1)} KB`;
  }

  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

export default function FileTable({ files,setFiles,role }) {
  if (!files.length) {
    return (
      <div className="empty-state">
        <h3>No files yet</h3>
        <p>Upload your first file to get started.</p>
      </div>
    );
  }
   const filesApi = {
    delete: (fileId) => api.delete(`/files/${fileId}`),
  };
  const handleDelete = async (fileId) => {
    const confirmed = window.confirm(
      "Are you sure you want to delete this file?",
    );

    if (!confirmed) return;

    try {
      await filesApi.delete(fileId);

      setFiles((current) => current.filter((file) => file._id !== fileId));
    } catch (error) {
      console.error("Delete failed:", error);
      alert(error.response?.data?.message || "Unable to delete file.");
    }
  };

  return (
    <div className="file-table">
      <div className="file-table-header">
        <span>File</span>
        <span>Type</span>
        <span>Size</span>
        <span>Status</span>
        <span />
      </div>

      {files.map((file) => (
        <div className="file-row" key={file._id}>
          <div className="file-name">
            <FileThumbnail file={file} />

            <div>
              <strong style={{ color: "black" }}>{file.name}</strong>

              <small>{new Date(file.createdAt).toLocaleDateString()}</small>
            </div>
          </div>

          <span>{file.type}</span>

          <span>{formatSize(file.size)}</span>

          <FileStatusBadge status={file.status} />
{
   role !=='viewer'&&
          <button
            type="button"
            onClick={() => handleDelete(file._id)}
            style={{
              color: "white",
              backgroundColor: "red",
              border: "none",
              borderRadius: "4px",
              cursor: "pointer",
            }}
          >
            X
          </button>
}
        </div>
        
      ))}
    </div>
  );
}
