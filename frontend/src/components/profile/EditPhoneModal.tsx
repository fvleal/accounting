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

function applyPhoneMask(raw: string): string {
  const digits = raw.replace(/\D/g, "").slice(0, 11);
  if (digits.length <= 2) return digits.length ? `(${digits}` : "";
  const ddd = digits.slice(0, 2);
  const rest = digits.slice(2);
  if (rest.length <= 4) return `(${ddd}) ${rest}`;
  // 9 digits: 5+4, 8 digits: 4+4
  const splitAt = rest.length > 8 ? 5 : 4;
  const part1 = rest.slice(0, splitAt);
  const part2 = rest.slice(splitAt);
  if (!part2) return `(${ddd}) ${part1}`;
  return `(${ddd}) ${part1}-${part2}`;
}

function stripPhoneMask(masked: string): string {
  return masked.replace(/\D/g, "");
}

function maskFromRaw(raw: string | null): string {
  if (!raw) return "";
  return applyPhoneMask(raw);
}

const phonePattern = /^[1-9]{2}[2-9]\d{7,8}$/;

export function EditPhoneModal({
  open,
  onClose,
  account,
}: EditPhoneModalProps) {
  const mutation = useSendPhoneCode();
  const { enqueueSnackbar } = useSnackbar();

  const {
    control,
    handleSubmit,
    reset,
    formState: { isValid, isDirty },
  } = useForm<EditPhoneFormData>({
    defaultValues: { phone: maskFromRaw(account.phone) },
    mode: "onTouched",
  });

  useEffect(() => {
    if (open) {
      reset({ phone: maskFromRaw(account.phone) });
    }
  }, [open, account.phone, reset]);

  if (!open) return null;

  const onSubmit = (values: EditPhoneFormData) => {
    const digits = stripPhoneMask(values.phone);
    mutation.mutate(digits, {
      onSuccess: () => {
        onClose();
        enqueueSnackbar("Celular alterado.", {
          variant: "success",
        });
      },
      onError: (error: any) => {
        const msg = error?.response?.data?.message || "Erro ao enviar código.";
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
            required: "Telefone é obrigatório",
            validate: (v) =>
              phonePattern.test(stripPhoneMask(v)) ||
              "Telefone inválido. Use DDD + 8 ou 9 dígitos (ex: 11987654321)",
          }}
          render={({ field, fieldState }) => (
            <TextField
              {...field}
              onChange={(e) => {
                field.onChange(applyPhoneMask(e.target.value));
              }}
              label="Telefone"
              type="tel"
              placeholder="(11) 98765-4321"
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
