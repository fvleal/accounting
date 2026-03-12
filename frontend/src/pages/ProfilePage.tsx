import { useCallback, useEffect, useRef, useState } from "react";
import { useSnackbar } from "notistack";
import { useAccount } from "../hooks/useAccount";
import { ProfileHero } from "../components/profile/ProfileHero";
import { ProfileSectionCard } from "../components/profile/ProfileSectionCard";
import { ProfileFieldRow } from "../components/profile/ProfileFieldRow";
import { ProfileSkeleton } from "../components/profile/ProfileSkeleton";
import { EditNameModal } from "../components/profile/EditNameModal";
import { EditBirthdayModal } from "../components/profile/EditBirthdayModal";
import { EditPhoneModal } from "../components/profile/EditPhoneModal";
import { CropPhotoModal } from "../components/profile/CropPhotoModal";
import { maskCpf } from "../utils/cpf";
import { formatBirthday } from "../utils/date";
import { formatPhone } from "../utils/phone";

export function ProfilePage() {
  const { data: account, isLoading, isError } = useAccount();
  const { enqueueSnackbar } = useSnackbar();
  const errorShownRef = useRef(false);
  const [editModal, setEditModal] = useState<
    "name" | "birthday" | "phone" | null
  >(null);
  const [cropImageUrl, setCropImageUrl] = useState<string | null>(null);

  const closeCropModal = useCallback(() => {
    setCropImageUrl((prev) => {
      if (prev) URL.revokeObjectURL(prev);
      return null;
    });
  }, []);

  useEffect(() => {
    if (isError && !errorShownRef.current) {
      errorShownRef.current = true;
      enqueueSnackbar("Erro ao carregar perfil.", { variant: "error" });
    }
    if (!isError) {
      errorShownRef.current = false;
    }
  }, [isError, enqueueSnackbar]);

  if (isLoading) {
    return <ProfileSkeleton />;
  }

  if (!account) {
    return null;
  }

  return (
    <>
      <ProfileHero account={account} onFileSelect={setCropImageUrl} isCropOpen={!!cropImageUrl} />
      <ProfileSectionCard title="Informacões Básicas">
        <ProfileFieldRow
          label="Nome"
          value={account.name}
          editable
          onClick={() => setEditModal("name")}
        />
        <ProfileFieldRow label="Email" value={account.email} />
        <ProfileFieldRow label="CPF" value={maskCpf(account.cpf)} />
      </ProfileSectionCard>
      <ProfileSectionCard title="Informações Adicionais">
        <ProfileFieldRow
          label="Nascimento"
          value={formatBirthday(account.birthDate)}
          editable
          onClick={() => setEditModal("birthday")}
        />
        <ProfileFieldRow
          label="Telefone"
          value={account.phone ? formatPhone(account.phone) : null}
          editable
          onClick={() => setEditModal("phone")}
        />
      </ProfileSectionCard>
      {account && (
        <>
          <EditNameModal
            open={editModal === "name"}
            onClose={() => setEditModal(null)}
            account={account}
          />
          <EditBirthdayModal
            open={editModal === "birthday"}
            onClose={() => setEditModal(null)}
            account={account}
          />
          <EditPhoneModal
            open={editModal === "phone"}
            onClose={() => setEditModal(null)}
            account={account}
          />
        </>
      )}
      {cropImageUrl && (
        <CropPhotoModal
          open={!!cropImageUrl}
          imageUrl={cropImageUrl}
          onClose={closeCropModal}
          onUploaded={closeCropModal}
        />
      )}
    </>
  );
}
