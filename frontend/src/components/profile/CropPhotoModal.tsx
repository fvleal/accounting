import { useRef, useState } from 'react';
import ReactCrop from 'react-image-crop';
import type { Crop, PixelCrop } from 'react-image-crop';
import 'react-image-crop/dist/ReactCrop.css';
import {
  Button,
  DialogActions,
  DialogContent,
  DialogTitle,
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
  const [crop, setCrop] = useState<Crop>();
  const [completedCrop, setCompletedCrop] = useState<PixelCrop>();
  const imgRef = useRef<HTMLImageElement>(null);
  const mutation = useUploadPhoto();
  const { enqueueSnackbar } = useSnackbar();

  if (!open) return null;

  const handleSave = async () => {
    if (!completedCrop) return;

    const blob = await getCroppedImg(imageUrl, completedCrop);
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
            style={{ maxHeight: 400, width: '100%', objectFit: 'contain' }}
          />
        </ReactCrop>
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
