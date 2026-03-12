/* eslint-disable @typescript-eslint/no-explicit-any */
import { useEffect } from "react";
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
import { nameRules } from "../../utils/validation";
import { useUpdateAccount } from "../../hooks/useUpdateAccount";
import type { Account } from "../../types/account";

interface EditNameModalProps {
  open: boolean;
  onClose: () => void;
  account: Account;
}

interface EditNameFormData {
  name: string;
}

export function EditNameModal({ open, onClose, account }: EditNameModalProps) {
  const mutation = useUpdateAccount();
  const { enqueueSnackbar } = useSnackbar();

  const { control, handleSubmit, reset, formState: { isValid, isDirty } } = useForm<EditNameFormData>({
    defaultValues: { name: account.name },
    mode: "onChange",
  });

  useEffect(() => {
    if (open) {
      reset({ name: account.name });
    }
  }, [open, account.name, reset]);

  if (!open) return null;

  const onSubmit = (values: EditNameFormData) => {
    mutation.mutate(
      { name: values.name.trim() },
      {
        onSuccess: () => {
          onClose();
          enqueueSnackbar("Nome atualizado!", { variant: "success" });
        },
        onError: (error: any) => {
          const msg =
            error?.response?.data?.message || "Erro ao atualizar nome.";
          enqueueSnackbar(msg, { variant: "error" });
        },
      },
    );
  };

  return (
    <AppDialog open onClose={onClose}>
      <DialogTitle>Editar nome</DialogTitle>
      <DialogContent>
        <Controller
          name="name"
          control={control}
          rules={nameRules}
          render={({ field, fieldState }) => (
            <TextField
              {...field}
              label="Nome completo"
              error={!!fieldState.error}
              helperText={fieldState.error?.message}
              fullWidth
              sx={{ mt: 1 }}
            />
          )}
        />
      </DialogContent>
      <DialogActions>
        <Button size="small" onClick={onClose} disabled={mutation.isPending}>
          Cancelar
        </Button>
        <Button
          size="small"
          variant="contained"
          disabled={!isDirty || !isValid}
          onClick={handleSubmit(onSubmit)}
          loading={mutation.isPending}
        >
          Salvar
        </Button>
      </DialogActions>
    </AppDialog>
  );
}
