import { useForm, Controller } from 'react-hook-form';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  Button,
} from '@mui/material';
import { useSnackbar } from 'notistack';
import { useUpdateAccount } from '../../hooks/useUpdateAccount';
import type { Account } from '../../types/account';

interface EditBirthdayModalProps {
  open: boolean;
  onClose: () => void;
  account: Account;
}

interface EditBirthdayFormData {
  birthDate: string;
}

export function EditBirthdayModal({ open, onClose, account }: EditBirthdayModalProps) {
  const mutation = useUpdateAccount();
  const { enqueueSnackbar } = useSnackbar();

  const { control, handleSubmit } = useForm<EditBirthdayFormData>({
    defaultValues: { birthDate: account.birthDate ?? '' },
    mode: 'onBlur',
  });

  if (!open) return null;

  const onSubmit = (values: EditBirthdayFormData) => {
    mutation.mutate(
      { birthDate: values.birthDate },
      {
        onSuccess: () => {
          onClose();
          enqueueSnackbar('Data de nascimento atualizada!', { variant: 'success' });
        },
        onError: (error: any) => {
          const msg =
            error?.response?.data?.message || 'Erro ao atualizar data de nascimento.';
          enqueueSnackbar(msg, { variant: 'error' });
        },
      },
    );
  };

  return (
    <Dialog
      open
      disableEscapeKeyDown
      onClose={(_e, reason) => {
        if (reason === 'backdropClick') return;
      }}
    >
      <DialogTitle>Editar data de nascimento</DialogTitle>
      <DialogContent>
        <Controller
          name="birthDate"
          control={control}
          render={({ field }) => (
            <TextField
              {...field}
              label="Data de nascimento"
              type="date"
              slotProps={{ inputLabel: { shrink: true } }}
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
    </Dialog>
  );
}
