import { Box, Typography } from "@mui/material";
import ReactQuill from "react-quill-new";
import "quill/dist/quill.snow.css";

export interface TextSectionData {
  html: string;
}

interface Props {
  data: TextSectionData;
  onChange: (data: TextSectionData) => void;
}

export default function TextSectionEditor({ data, onChange }: Props) {
  const handleChange = (html: string) => onChange({ ...data, html });

  return (
    <Box>
      <Typography variant="caption" color="textSecondary" sx={{ mb: 1, display: "block" }}>
        Editor de Texto
      </Typography>

      <ReactQuill
        theme="snow"
        value={data?.html ?? ""}
        onChange={handleChange}
        style={{ height: "200px", marginBottom: "50px" }}
      />
    </Box>
  );
}
