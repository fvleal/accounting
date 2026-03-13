import { useRef, useState, type ChangeEvent } from "react";
import { Avatar, Box, CircularProgress } from "@mui/material";
import CameraAltIcon from "@mui/icons-material/CameraAlt";
import { useSnackbar } from "notistack";
import type { Account } from "../../types/account";
import { getInitials, getAvatarColor } from "../../utils/initials";

interface ProfileHeroProps {
  account: Account;
  onFileSelect: (imageUrl: string) => void;
  isCropOpen?: boolean;
}

function isHeic(file: File): boolean {
  if (
    file.type === "image/heic" ||
    file.type === "image/heif"
  ) {
    return true;
  }
  // Some browsers don't set MIME for HEIC; fall back to extension
  if (!file.type || file.type === "application/octet-stream") {
    return /\.heic$/i.test(file.name) || /\.heif$/i.test(file.name);
  }
  return false;
}

export function ProfileHero({
  account,
  onFileSelect,
  isCropOpen,
}: ProfileHeroProps) {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [converting, setConverting] = useState(false);
  const { enqueueSnackbar } = useSnackbar();

  const handleAvatarClick = () => {
    if (isCropOpen || converting) return;
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
      fileInputRef.current.click();
    }
  };

  const handleFileSelect = async (e: ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (isHeic(file)) {
      setConverting(true);
      try {
        const heic2any = (await import("heic2any")).default;
        const jpegBlob = await heic2any({
          blob: file,
          toType: "image/jpeg",
          quality: 0.9,
        });
        const result = Array.isArray(jpegBlob) ? jpegBlob[0] : jpegBlob;
        const url = URL.createObjectURL(result);
        onFileSelect(url);
      } catch {
        enqueueSnackbar("Erro ao processar imagem.", { variant: "error" });
      } finally {
        setConverting(false);
      }
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
      <Box
        onClick={handleAvatarClick}
        sx={{ cursor: "pointer", position: "relative", display: "inline-flex" }}
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
        {converting ? (
          <Box
            sx={{
              position: "absolute",
              top: 0,
              left: 0,
              width: 80,
              height: 80,
              borderRadius: "50%",
              bgcolor: "rgba(0,0,0,0.5)",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
            }}
          >
            <CircularProgress size={32} sx={{ color: "white" }} />
          </Box>
        ) : (
          <Box
            sx={{
              position: "absolute",
              bottom: -10,
              left: "50%",
              transform: "translateX(-50%)",
              width: 24,
              height: 24,
              borderRadius: "50%",
              bgcolor: "grey.800",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
            }}
          >
            <CameraAltIcon sx={{ fontSize: 14, color: "white" }} />
          </Box>
        )}
      </Box>
      <input
        ref={fileInputRef}
        type="file"
        accept="image/*"
        hidden
        onChange={handleFileSelect}
      />
    </Box>
  );
}
