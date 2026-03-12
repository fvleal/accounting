import { useRef, type ChangeEvent } from "react";
import { Avatar, Badge, Box } from "@mui/material";
import CameraAltIcon from "@mui/icons-material/CameraAlt";
import { useSnackbar } from "notistack";
import type { Account } from "../../types/account";
import { getInitials, getAvatarColor } from "../../utils/initials";

interface ProfileHeroProps {
  account: Account;
  onFileSelect: (imageUrl: string) => void;
}

export function ProfileHero({ account, onFileSelect }: ProfileHeroProps) {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { enqueueSnackbar } = useSnackbar();

  const handleAvatarClick = () => {
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
      fileInputRef.current.click();
    }
  };

  const handleFileSelect = (e: ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!["image/jpeg", "image/png"].includes(file.type)) {
      enqueueSnackbar("Formato nao suportado. Use JPEG ou PNG.", {
        variant: "error",
      });
      return;
    }

    if (file.size > 5 * 1024 * 1024) {
      enqueueSnackbar("Arquivo muito grande (max 5MB).", {
        variant: "error",
      });
      return;
    }

    const url = URL.createObjectURL(file);
    onFileSelect(url);
  };

  return (
    <Box
      sx={{
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        mb: 3,
        mt: 2,
      }}
    >
      <Box onClick={handleAvatarClick} sx={{ cursor: "pointer" }}>
        <Badge
          overlap="circular"
          anchorOrigin={{ vertical: "bottom", horizontal: "right" }}
          badgeContent={
            <Box
              sx={{
                width: 24,
                height: 24,
                borderRadius: "50%",
                bgcolor: "primary.main",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
              }}
            >
              <CameraAltIcon sx={{ fontSize: 14, color: "white" }} />
            </Box>
          }
        >
          <Avatar
            src={account.photoUrl ?? undefined}
            sx={{
              width: 80,
              height: 80,
              bgcolor: getAvatarColor(account.name),
              fontSize: "1.5rem",
            }}
          >
            {getInitials(account.name)}
          </Avatar>
        </Badge>
      </Box>
      <input
        ref={fileInputRef}
        type="file"
        accept="image/jpeg,image/png"
        hidden
        onChange={handleFileSelect}
      />
    </Box>
  );
}
