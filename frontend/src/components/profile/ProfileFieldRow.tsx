import { Box, Typography } from "@mui/material";
import ChevronRightIcon from "@mui/icons-material/ChevronRight";

interface ProfileFieldRowProps {
  label: string;
  value: string | null;
  editable?: boolean;
  onClick?: () => void;
}

export function ProfileFieldRow({
  label,
  value,
  editable,
  onClick,
}: ProfileFieldRowProps) {
  return (
    <Box
      onClick={editable ? onClick : undefined}
      role={editable ? "button" : undefined}
      tabIndex={editable ? 0 : undefined}
      sx={{
        display: "flex",
        alignItems: "center",
        justifyContent: "space-between",
        gap: 2,
        py: 1.5,
        px: 2,
        cursor: editable ? "pointer" : "default",
      }}
    >
      <Typography variant="subtitle2" color="text.secondary">
        {label}
      </Typography>
      <Box sx={{ display: "flex", alignItems: "center", gap: 0.5 }}>
        <Typography
          variant="body2"
          color={!value || !editable ? "text.secondary" : "text.primary"}
        >
          {value ?? "Inserir"}
        </Typography>
        {editable && (
          <ChevronRightIcon
            data-testid="chevron-icon"
            sx={{ fontSize: 20, color: "text.secondary" }}
          />
        )}
      </Box>
    </Box>
  );
}
