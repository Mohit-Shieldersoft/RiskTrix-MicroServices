const BASE = "/api/v1";

const fileApi = {
  uploadFile: async (file, context = "general", refId = null) => {
    const formData = new FormData();
    formData.append("file", file);
    const params = new URLSearchParams({ context });
    if (refId) params.append("ref_id", refId);

    const res = await fetch(`${BASE}/files/upload?${params.toString()}`, {
      method: "POST",
      body: formData,
    });
    if (!res.ok) {
      const err = await res.json();
      throw { response: { data: err } };
    }
    return res.json();
  },

  listFiles: async (context = null, refId = null) => {
    const params = new URLSearchParams();
    if (context) params.append("context", context);
    if (refId) params.append("ref_id", refId);
    const res = await fetch(`${BASE}/files/list?${params.toString()}`);
    if (!res.ok) throw new Error(await res.text());
    return res.json();
  },

  getFileInfo: async (fileId) => {
    const res = await fetch(`${BASE}/files/info/${fileId}`);
    if (!res.ok) throw new Error(await res.text());
    return res.json();
  },

  downloadFile: async (fileId, fileName) => {
    const res = await fetch(`${BASE}/files/download/${fileId}`);
    if (!res.ok) throw new Error("Download failed");
    const blob = await res.blob();
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = fileName;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    window.URL.revokeObjectURL(url);
  },

  deleteFile: async (fileId) => {
    const res = await fetch(`${BASE}/files/${fileId}`, { method: "DELETE" });
    if (!res.ok) throw new Error(await res.text());
    return res.json();
  },
};

export default fileApi;