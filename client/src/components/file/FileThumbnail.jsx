export default function FileThumbnail({
    file,
  }) {
    const isImage =
      file.type === "image/jpeg" ||
      file.type === "image/png";
  
    if (!isImage) {
      return (
        <div className="file-icon">
          📄
        </div>
      );
    }
  
    if (!file.thumbnailUrl) {
      return (
        <div className="file-icon">
          🖼️
        </div>
      );
    }
  
    return (
      <img
        src={file.thumbnailUrl}
        alt={file.name}
        className="file-thumbnail"
      />
    );
  }