import { useRef, useState } from "react";
import ReactCrop, { centerCrop, makeAspectCrop } from "react-image-crop";
import type { Crop, PixelCrop } from "react-image-crop";
import "react-image-crop/dist/ReactCrop.css";
import {
  Button,
  DialogActions,
  DialogContent,
  DialogTitle,
} from "@mui/material";
import { useSnackbar } from "notistack";
import { AppDialog } from "../common/AppDialog";
import { useUploadPhoto } from "../../hooks/useUploadPhoto";

interface CropPhotoModalProps {
  open: boolean;
  imageUrl: string;
  onClose: () => void;
  onUploaded: () => void;
}

function getScaledCrop(
  crop: PixelCrop,
  image: HTMLImageElement,
): PixelCrop {
  const scaleX = image.naturalWidth / image.width;
  const scaleY = image.naturalHeight / image.height;
  return {
    unit: "px",
    x: crop.x * scaleX,
    y: crop.y * scaleY,
    width: crop.width * scaleX,
    height: crop.height * scaleY,
  };
}

function canvasToJpegBlob(
  canvas: HTMLCanvasElement,
  quality: number,
): Promise<Blob> {
  return new Promise((resolve, reject) => {
    canvas.toBlob(
      (blob) => (blob ? resolve(blob) : reject(new Error("toBlob returned null"))),
      "image/jpeg",
      quality,
    );
  });
}

const MAX_FILE_SIZE = 5 * 1024 * 1024;

export function CropPhotoModal({
  open,
  imageUrl,
  onClose,
  onUploaded,
}: CropPhotoModalProps) {
  const [crop, setCrop] = useState<Crop>();
  const [completedCrop, setCompletedCrop] = useState<PixelCrop>();
  const imgRef = useRef<HTMLImageElement>(null);
  const mutation = useUploadPhoto();
  const { enqueueSnackbar } = useSnackbar();

  const onImageError = () => {
    enqueueSnackbar("Formato de imagem não suportado.", { variant: "error" });
    onClose();
  };

  const onImageLoad = (e: React.SyntheticEvent<HTMLImageElement>) => {
    const { naturalWidth, naturalHeight } = e.currentTarget;
    const initialCrop = centerCrop(
      makeAspectCrop(
        { unit: "%", width: 70 },
        3 / 4,
        naturalWidth,
        naturalHeight,
      ),
      naturalWidth,
      naturalHeight,
    );
    setCrop(initialCrop);
  };

  if (!open) return null;

  const handleSave = async () => {
    if (!completedCrop || !imgRef.current) return;

    const scaled = getScaledCrop(completedCrop, imgRef.current);
    const canvas = document.createElement("canvas");
    canvas.width = scaled.width;
    canvas.height = scaled.height;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    ctx.fillStyle = "#FFFFFF";
    ctx.fillRect(0, 0, scaled.width, scaled.height);
    ctx.drawImage(
      imgRef.current,
      scaled.x,
      scaled.y,
      scaled.width,
      scaled.height,
      0,
      0,
      scaled.width,
      scaled.height,
    );

    let quality = 0.9;
    let blob: Blob | null = null;
    while (quality >= 0.1) {
      blob = await canvasToJpegBlob(canvas, Math.round(quality * 10) / 10);
      if (blob.size <= MAX_FILE_SIZE) break;
      quality -= 0.1;
    }
    if (!blob || blob.size > MAX_FILE_SIZE) {
      enqueueSnackbar("Imagem muito grande.", { variant: "error" });
      return;
    }

    const file = new File([blob], "photo.jpg", { type: "image/jpeg" });

    mutation.mutate(file, {
      onSuccess: () => {
        enqueueSnackbar("Foto atualizada!", { variant: "success" });
        onClose();
        onUploaded();
      },
      onError: () => {
        enqueueSnackbar("Erro ao enviar foto.", { variant: "error" });
      },
    });
  };

  return (
    <AppDialog open disableEscapeKeyDown onClose={onClose}>
      <DialogTitle>Recortar foto</DialogTitle>
      <DialogContent sx={{ display: "flex", flexDirection: "column", alignItems: "center" }}>
        <ReactCrop
          crop={crop}
          onChange={(c) => setCrop(c)}
          onComplete={(c) => setCompletedCrop(c)}
          aspect={3 / 4}
        >
          <img
            ref={imgRef}
            src={imageUrl}
            alt="Crop preview"
            onLoad={onImageLoad}
            onError={onImageError}
            style={{ maxHeight: 400, width: "100%", objectFit: "contain" }}
          />
        </ReactCrop>
      </DialogContent>
      <DialogActions>
        <Button size="small" onClick={onClose}>Cancelar</Button>
        <Button
          size="small"
          variant="contained"
          onClick={handleSave}
          loading={mutation.isPending}
        >
          Salvar
        </Button>
      </DialogActions>
    </AppDialog>
  );
}
