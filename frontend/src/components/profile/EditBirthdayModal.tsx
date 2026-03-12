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
import { birthDateRules } from "../../utils/validation";
import { useUpdateAccount } from "../../hooks/useUpdateAccount";
import type { Account } from "../../types/account";

interface EditBirthdayModalProps {
  open: boolean;
  onClose: () => void;
  account: Account;
}

interface EditBirthdayFormData {
  birthDate: string;
}

function toDateInput(iso: string | null): string {
  if (!iso) return "";
  return iso.split("T")[0];
}

export function EditBirthdayModal({
  open,
  onClose,
  account,
}: EditBirthdayModalProps) {
  const mutation = useUpdateAccount();
  const { enqueueSnackbar } = useSnackbar();

  const { control, handleSubmit, reset, formState: { isValid, isDirty } } = useForm<EditBirthdayFormData>({
    defaultValues: { birthDate: toDateInput(account.birthDate) },
    mode: "onTouched",
  });

  useEffect(() => {
    if (open) {
      reset({ birthDate: toDateInput(account.birthDate) });
    }
  }, [open, account.birthDate, reset]);

  if (!open) return null;

  const onSubmit = (values: EditBirthdayFormData) => {
    mutation.mutate(
      { birthDate: values.birthDate },
      {
        onSuccess: () => {
          onClose();
          enqueueSnackbar("Data de nascimento atualizada!", {
            variant: "success",
          });
        },
        onError: (error: any) => {
          const msg =
            error?.response?.data?.message ||
            "Erro ao atualizar data de nascimento.";
          enqueueSnackbar(msg, { variant: "error" });
        },
      },
    );
  };

  return (
    <AppDialog open onClose={onClose}>
      <DialogTitle>Editar data de nascimento</DialogTitle>
      <DialogContent>
        <Controller
          name="birthDate"
          control={control}
          rules={birthDateRules}
          render={({ field, fieldState }) => (
            <TextField
              {...field}
              label="Data de nascimento"
              type="date"
              error={!!fieldState.error}
              helperText={fieldState.error?.message}
              slotProps={{ inputLabel: { shrink: true } }}
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
