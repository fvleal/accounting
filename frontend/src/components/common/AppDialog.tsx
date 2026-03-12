import { Dialog, type DialogProps } from '@mui/material';

interface AppDialogProps extends Omit<DialogProps, 'onClose'> {
  onClose: () => void;
}

export function AppDialog({
  onClose,
  children,
  PaperProps,
  ...rest
}: AppDialogProps) {
  return (
    <Dialog
      {...rest}
      disableEscapeKeyDown
      onClose={(_e, reason) => {
        if (reason === 'backdropClick') return;
        onClose();
      }}
      PaperProps={{
        ...PaperProps,
        sx: {
          minWidth: 360,
          maxWidth: 480,
          width: '100%',
          minHeight: 120,
          ...PaperProps?.sx,
        },
      }}
    >
      {children}
    </Dialog>
  );
}
