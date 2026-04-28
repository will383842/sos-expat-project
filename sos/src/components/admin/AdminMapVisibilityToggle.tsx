import React from 'react';
import { doc, updateDoc, onSnapshot, serverTimestamp } from 'firebase/firestore';
import { db } from '../../config/firebase';
import { useTabVisibility } from '../../hooks/useTabVisibility';

interface Props {
  userId: string;
  className?: string;
}

export default function AdminMapVisibilityToggle({ userId, className = '' }: Props) {
  const [checked, setChecked] = React.useState<boolean>(true);
  const isVisible = useTabVisibility();

  React.useEffect(() => {
    if (!isVisible) return;
    if (!userId) return;
    const ref = doc(db, 'sos_profiles', userId);
    return onSnapshot(ref, (snap) => {
      const data = snap.data() as any;
      setChecked(Boolean(data?.isVisibleOnMap ?? true));
    }, (err) => {
      console.error('[AdminMapVisibilityToggle] Snapshot error:', err);
    });
  }, [userId, isVisible]);

  const onToggle = async (next: boolean) => {
    await updateDoc(doc(db, 'sos_profiles', userId), {
      isVisibleOnMap: next,
      updatedAt: serverTimestamp(),
    });
  };

  return (
    <label className={`inline-flex items-center gap-2 ${className}`}>
      <input type="checkbox" checked={checked} onChange={e => onToggle(e.target.checked)} />
      <span>Visible sur la carte</span>
    </label>
  );
}


