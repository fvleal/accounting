/* eslint-disable @typescript-eslint/no-explicit-any */
import { useForm, Controller } from "react-hook-form";
import {
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  Button,
} from "@mui/material";
import { AppDialog } from "../common/AppDialog";
import { useSnackbar } from "notistack";
import { useSendPhoneCode } from "../../hooks/useSendPhoneCode";
import type { Account } from "../../types/account";

interface EditPhoneModalProps {
  open: boolean;
  onClose: () => void;
  account: Account;
}

interface EditPhoneFormData {
  phone: string;
}

const phonePattern = /^[1-9]{2}[2-9]\d{7,8}$/;

export function EditPhoneModal({
  open,
  onClose,
  account,
}: EditPhoneModalProps) {
  const mutation = useSendPhoneCode();
  const { enqueueSnackbar } = useSnackbar();

  const { control, handleSubmit } = useForm<EditPhoneFormData>({
    defaultValues: { phone: account.phone ?? "" },
    mode: "onBlur",
  });

  if (!open) return null;

  const onSubmit = (values: EditPhoneFormData) => {
    mutation.mutate(values.phone, {
      onSuccess: () => {
        onClose();
        enqueueSnackbar("Codigo enviado! Telefone salvo como nao verificado.", {
          variant: "success",
        });
      },
      onError: (error: any) => {
        const msg = error?.response?.data?.message || "Erro ao enviar codigo.";
        enqueueSnackbar(msg, { variant: "error" });
      },
    });
  };

  return (
    <AppDialog open onClose={onClose}>
      <DialogTitle>Editar telefone</DialogTitle>
      <DialogContent>
        <Controller
          name="phone"
          control={control}
          rules={{
            required: "Telefone e obrigatorio",
            pattern: {
              value: phonePattern,
              message:
                "Telefone invalido. Use DDD + 8 ou 9 digitos (ex: 11987654321)",
            },
          }}
          render={({ field, fieldState }) => (
            <TextField
              {...field}
              label="Telefone"
              type="tel"
              placeholder="11987654321"
              error={!!fieldState.error}
              helperText={fieldState.error?.message}
              fullWidth
              sx={{ mt: 1 }}
            />
          )}
        />
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose} disabled={mutation.isPending}>
          Cancelar
        </Button>
        <Button
          variant="contained"
          onClick={handleSubmit(onSubmit)}
          loading={mutation.isPending}
        >
          Salvar
        </Button>
      </DialogActions>
    </AppDialog>
  );
}
