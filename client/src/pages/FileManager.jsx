import { useFileSocket } from "../hooks/useFileSocket.js";
import { useEffect, useState, useCallback } from "react";

import { useAuth } from "../context/AuthContext.jsx";
import { filesApi } from "../api/files.js";
import UploadZone from "../components/file/UploadZone.jsx";
import FileTable from "../components/file/FileTable.jsx";


export default function FileManager() {
  const { accessToken, user } = useAuth();
  const [files, setFiles] = useState([]);
  const [loading, setLoading] = useState(true);

  const handleFileUpdated = useCallback(
    (updatedFile) => {
      console.log(
        "Socket file update:",
        updatedFile
      );
  
      setFiles((current) =>
        current.map((file) =>
          file._id === updatedFile.fileId
            ? {
                ...file,
                status: updatedFile.status,
                metadata:
                  updatedFile.metadata,
                thumbnailKey:
                  updatedFile.thumbnailKey,
              }
            : file
        )
      );
    },
    []
  );
  
  useFileSocket(
    user?.id,
    handleFileUpdated
  );

  

  async function loadFiles() {
    try {
      setLoading(true);

      const response = await filesApi.list(accessToken);

      setFiles(response.data || []);
    } catch (error) {
      console.error("Failed to load files:", error);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    if (accessToken) {
      loadFiles();
    }
  }, [accessToken]);

  const handleUploadComplete = useCallback((uploadedFile) => {
    setFiles(currentFiles => [
      uploadedFile,
      ...currentFiles,
    ]);
  }, []);

  return (
    <div className="file-manager">
      <div className="file-manager-header">
        <div>
          <h1>File Manager</h1>
          <p>
            Upload, manage and track your files.
          </p>
        </div>
      </div>
{

   user.role !== 'viewer' &&
      <UploadZone
        accessToken={accessToken}
        onUploadComplete={handleUploadComplete}
      />
}


      <section className="files-section">
        <div className="files-section-header">
          <h2>Files</h2>

          <button onClick={loadFiles}>
            Refresh
          </button>
        </div>

        {loading ? (
          <p>Loading files...</p>
        ) : (
          <FileTable
            files={files}
            accessToken={accessToken}
            setFiles={setFiles}
            role = {user?.role}
          />
        )}
      </section>
    </div>
  );
}