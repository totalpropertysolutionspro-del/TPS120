import { useEffect, useState, useRef } from "react";
import {
  Upload,
  Download,
  Trash2,
  FileText,
  Image,
  File,
  X,
  Search,
} from "lucide-react";
import * as api from "../api/client";

const MAX_FILE_SIZE = 5 * 1024 * 1024; // 5MB

const ENTITY_FILTERS = [
  { value: "", label: "All" },
  { value: "tenant", label: "Tenant" },
  { value: "property", label: "Property" },
  { value: "vendor", label: "Vendor" },
  { value: "ticket", label: "Ticket" },
];

function getFileIcon(mimeType: string) {
  if (!mimeType) return <File className="w-6 h-6 text-gray-400" />;
  if (mimeType.startsWith("image/"))
    return <Image className="w-6 h-6 text-purple-500" />;
  if (mimeType.includes("pdf"))
    return <FileText className="w-6 h-6 text-red-500" />;
  if (
    mimeType.includes("spreadsheet") ||
    mimeType.includes("excel") ||
    mimeType.includes("csv")
  )
    return <FileText className="w-6 h-6 text-green-500" />;
  if (
    mimeType.includes("document") ||
    mimeType.includes("word") ||
    mimeType.includes("text")
  )
    return <FileText className="w-6 h-6 text-blue-500" />;
  return <File className="w-6 h-6 text-gray-400" />;
}

function formatFileSize(bytes: number): string {
  if (bytes === 0) return "0 B";
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

function getEntityBadge(entityType: string) {
  switch (entityType) {
    case "tenant":
      return "badge-info";
    case "property":
      return "badge-success";
    case "vendor":
      return "badge-warning";
    case "ticket":
      return "badge-danger";
    default:
      return "bg-gray-100 text-gray-800";
  }
}

export default function Files() {
  const [files, setFiles] = useState<api.FileRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const [showUpload, setShowUpload] = useState(false);
  const [filterType, setFilterType] = useState("");
  const [searchTerm, setSearchTerm] = useState("");
  const [error, setError] = useState("");
  const [uploadData, setUploadData] = useState({
    entityType: "",
    entityId: "",
  });
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    fetchFiles();
  }, []);

  const fetchFiles = async () => {
    try {
      setLoading(true);
      const res = await api.getFiles();
      setFiles(res.data);
    } catch (err) {
      console.error("Failed to fetch files:", err);
    } finally {
      setLoading(false);
    }
  };

  const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.size > MAX_FILE_SIZE) {
      setError("File size must be under 5MB.");
      return;
    }

    setError("");
    setUploading(true);

    try {
      const formData = new FormData();
      formData.append("file", file);
      if (uploadData.entityType)
        formData.append("entityType", uploadData.entityType);
      if (uploadData.entityId)
        formData.append("entityId", uploadData.entityId);
      await api.uploadFile(formData);
      setShowUpload(false);
      setUploadData({ entityType: "", entityId: "" });
      fetchFiles();
    } catch (err) {
      console.error("Failed to upload file:", err);
      setError("Upload failed. Please try again.");
    } finally {
      setUploading(false);
      if (fileInputRef.current) fileInputRef.current.value = "";
    }
  };

  const handleDownload = async (file: api.FileRecord) => {
    try {
      const res = await api.getFile(file.id);
      const data = res.data as any;
      if (data.data) {
        // Base64 data from API
        const byteCharacters = atob(data.data);
        const byteNumbers = new Array(byteCharacters.length);
        for (let i = 0; i < byteCharacters.length; i++) {
          byteNumbers[i] = byteCharacters.charCodeAt(i);
        }
        const byteArray = new Uint8Array(byteNumbers);
        const blob = new Blob([byteArray], {
          type: file.mimeType || "application/octet-stream",
        });
        const url = URL.createObjectURL(blob);
        const a = document.createElement("a");
        a.href = url;
        a.download = file.originalName || file.filename;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
      } else {
        // Fallback: create blob from response
        const blob = new Blob([JSON.stringify(res.data)], {
          type: file.mimeType || "application/octet-stream",
        });
        const url = URL.createObjectURL(blob);
        const a = document.createElement("a");
        a.href = url;
        a.download = file.originalName || file.filename;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
      }
    } catch (err) {
      console.error("Failed to download file:", err);
    }
  };

  const handleDelete = async (id: string) => {
    if (confirm("Are you sure you want to delete this file?")) {
      try {
        await api.deleteFile(id);
        fetchFiles();
      } catch (err) {
        console.error("Failed to delete file:", err);
      }
    }
  };

  const resetUpload = () => {
    setUploadData({ entityType: "", entityId: "" });
    setShowUpload(false);
    setError("");
  };

  const filteredFiles = files.filter((f) => {
    const matchesType = !filterType || f.entityType === filterType;
    const matchesSearch =
      !searchTerm ||
      (f.originalName || f.filename || "")
        .toLowerCase()
        .includes(searchTerm.toLowerCase());
    return matchesType && matchesSearch;
  });

  if (loading) {
    return <div className="text-center py-12">Loading files...</div>;
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-3xl font-bold text-gray-900">Files</h2>
        <button
          onClick={() => {
            resetUpload();
            setShowUpload(true);
          }}
          className="btn btn-primary flex items-center gap-2"
        >
          <Upload className="w-5 h-5" />
          Upload File
        </button>
      </div>

      {showUpload && (
        <div className="card">
          <div className="flex justify-between items-center mb-4">
            <h3 className="text-lg font-semibold">Upload File</h3>
            <button
              onClick={resetUpload}
              className="text-gray-400 hover:text-gray-600"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
          <div className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <select
                value={uploadData.entityType}
                onChange={(e) =>
                  setUploadData({
                    ...uploadData,
                    entityType: e.target.value,
                    entityId: "",
                  })
                }
                className="input"
              >
                <option value="">No entity link</option>
                <option value="tenant">Tenant</option>
                <option value="property">Property</option>
                <option value="vendor">Vendor</option>
                <option value="ticket">Ticket</option>
              </select>
              {uploadData.entityType && (
                <input
                  type="text"
                  placeholder="Entity ID"
                  value={uploadData.entityId}
                  onChange={(e) =>
                    setUploadData({ ...uploadData, entityId: e.target.value })
                  }
                  className="input"
                />
              )}
            </div>

            {/* Drop zone visual */}
            <div
              className="border-2 border-dashed border-gray-300 rounded-lg p-8 text-center hover:border-emerald-500 hover:bg-emerald-50 transition-colors cursor-pointer"
              onClick={() => fileInputRef.current?.click()}
            >
              <Upload className="w-10 h-10 text-gray-400 mx-auto mb-3" />
              <p className="text-gray-600 font-medium">
                Click to select a file
              </p>
              <p className="text-sm text-gray-400 mt-1">Max file size: 5MB</p>
              <input
                ref={fileInputRef}
                type="file"
                onChange={handleFileSelect}
                className="hidden"
              />
            </div>

            {uploading && (
              <div className="text-center text-sm text-emerald-600">
                Uploading...
              </div>
            )}
            {error && (
              <div className="text-center text-sm text-red-600">{error}</div>
            )}
          </div>
        </div>
      )}

      {/* Search and Filters */}
      <div className="flex flex-col sm:flex-row gap-4">
        <div className="relative flex-1">
          <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
          <input
            type="text"
            placeholder="Search files..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="input pl-10"
          />
        </div>
        <div className="flex gap-2">
          {ENTITY_FILTERS.map((ef) => (
            <button
              key={ef.value}
              onClick={() => setFilterType(ef.value)}
              className={`px-3 py-2 rounded text-sm font-medium transition-colors ${
                filterType === ef.value
                  ? "bg-emerald-600 text-white"
                  : "bg-gray-100 text-gray-600 hover:bg-gray-200"
              }`}
            >
              {ef.label}
            </button>
          ))}
        </div>
      </div>

      {/* Files Table */}
      {filteredFiles.length === 0 ? (
        <div className="card text-center py-12">
          <FileText className="w-12 h-12 text-gray-300 mx-auto mb-4" />
          <p className="text-gray-500">
            {searchTerm || filterType
              ? "No files match your filters."
              : "No files yet. Upload one to get started!"}
          </p>
        </div>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                  File
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                  Type
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                  Size
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                  Linked To
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                  Uploaded
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="divide-y">
              {filteredFiles.map((file) => (
                <tr key={file.id} className="hover:bg-gray-50">
                  <td className="px-6 py-4 text-sm">
                    <div className="flex items-center gap-3">
                      {getFileIcon(file.mimeType)}
                      <span className="font-medium text-gray-900 truncate max-w-[200px]">
                        {file.originalName || file.filename}
                      </span>
                    </div>
                  </td>
                  <td className="px-6 py-4 text-sm text-gray-600">
                    {file.mimeType
                      ? file.mimeType.split("/").pop()
                      : "unknown"}
                  </td>
                  <td className="px-6 py-4 text-sm text-gray-600">
                    {formatFileSize(file.size)}
                  </td>
                  <td className="px-6 py-4 text-sm">
                    {file.entityType ? (
                      <span
                        className={`badge text-xs ${getEntityBadge(
                          file.entityType
                        )}`}
                      >
                        {file.entityType}
                      </span>
                    ) : (
                      <span className="text-gray-400">-</span>
                    )}
                  </td>
                  <td className="px-6 py-4 text-sm text-gray-600">
                    {new Date(file.createdAt).toLocaleDateString()}
                  </td>
                  <td className="px-6 py-4 text-sm space-x-2">
                    <button
                      onClick={() => handleDownload(file)}
                      className="text-emerald-600 hover:text-emerald-900"
                    >
                      <Download className="w-4 h-4" />
                    </button>
                    <button
                      onClick={() => handleDelete(file.id)}
                      className="text-red-600 hover:text-red-900"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
