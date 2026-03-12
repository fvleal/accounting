import { useCallback, useEffect, useState } from 'react';
import Cropper from 'react-easy-crop';
import type { Area } from 'react-easy-crop';
import {
  Box,
  Button,
  DialogActions,
  DialogContent,
  DialogTitle,
  Slider,
} from '@mui/material';
import { useSnackbar } from 'notistack';
import { AppDialog } from '../common/AppDialog';
import { getCroppedImg } from '../../utils/cropImage';
import { useUploadPhoto } from '../../hooks/useUploadPhoto';

interface CropPhotoModalProps {
  open: boolean;
  imageUrl: string;
  onClose: () => void;
  onUploaded: () => void;
}

export function CropPhotoModal({
  open,
  imageUrl,
  onClose,
  onUploaded,
}: CropPhotoModalProps) {
  const [crop, setCrop] = useState({ x: 0, y: 0 });
  const [zoom, setZoom] = useState(1);
  const [croppedAreaPixels, setCroppedAreaPixels] = useState<Area | null>(null);
  const mutation = useUploadPhoto();
  const { enqueueSnackbar } = useSnackbar();

  const onCropComplete = useCallback((_: Area, areaPixels: Area) => {
    setCroppedAreaPixels(areaPixels);
  }, []);

  useEffect(() => {
    return () => {
      URL.revokeObjectURL(imageUrl);
    };
  }, [imageUrl]);

  if (!open) return null;

  const handleSave = async () => {
    if (!croppedAreaPixels) return;

    const blob = await getCroppedImg(imageUrl, croppedAreaPixels);
    const file = new File([blob], 'photo.jpg', { type: 'image/jpeg' });

    mutation.mutate(file, {
      onSuccess: () => {
        enqueueSnackbar('Foto atualizada!', { variant: 'success' });
        onClose();
        onUploaded();
      },
      onError: () => {
        enqueueSnackbar('Erro ao enviar foto.', { variant: 'error' });
      },
    });
  };

  return (
    <AppDialog open disableEscapeKeyDown onClose={onClose}>
      <DialogTitle>Recortar foto</DialogTitle>
      <DialogContent>
        <Box
          sx={{
            position: 'relative',
            height: 350,
            width: '100%',
            bgcolor: 'black',
          }}
        >
          <Cropper
            image={imageUrl}
            crop={crop}
            zoom={zoom}
            aspect={3 / 4}
            cropShape="rect"
            showGrid
            onCropChange={setCrop}
            onZoomChange={setZoom}
            onCropComplete={onCropComplete}
          />
        </Box>
        <Box sx={{ px: 2, pt: 2 }}>
          <Slider
            min={1}
            max={3}
            step={0.01}
            value={zoom}
            onChange={(_, v) => setZoom(v as number)}
            aria-label="Zoom"
          />
        </Box>
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose}>Cancelar</Button>
        <Button
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
