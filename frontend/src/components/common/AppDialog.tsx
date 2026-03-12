import { Dialog, type DialogProps } from "@mui/material";

interface AppDialogProps extends Omit<DialogProps, "onClose"> {
  onClose: () => void;
}

export function AppDialog({
  onClose,
  children,
  slotProps,
  ...rest
}: AppDialogProps) {
  return (
    <Dialog
      {...rest}
      onClose={() => onClose()}
      slotProps={{
        ...slotProps,
        paper: {
          ...slotProps?.paper,
          sx: {
            minWidth: 360,
            maxWidth: 480,
            width: "100%",
            minHeight: 120,
            ...(slotProps?.paper as { sx?: object })?.sx,
          },
        },
      }}
    >
      {children}
    </Dialog>
  );
}
