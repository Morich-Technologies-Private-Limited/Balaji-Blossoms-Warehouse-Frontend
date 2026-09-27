import { useEffect, useRef, useSyncExternalStore } from 'react';
import { CheckCircle2, XCircle, AlertTriangle, HelpCircle, Loader2 } from 'lucide-react';
import styles from './FeedbackModal.module.css';
import { subscribeFeedback, getFeedbackState, closeDialog } from '../utils/feedback';

const ICONS = {
  success: CheckCircle2,
  error: XCircle,
  warning: AlertTriangle,
  confirm: HelpCircle,
};

// Global success / failure / warning / confirm / waiting modals (see utils/feedback.js)
const FeedbackModal = () => {
  const { loading, dialogs } = useSyncExternalStore(subscribeFeedback, getFeedbackState);
  const dialog = dialogs[0]; // one at a time, the rest wait in queue
  const primaryRef = useRef(null);

  useEffect(() => {
    if (!dialog) return undefined;
    primaryRef.current?.focus();

    const onKeyDown = (e) => {
      if (e.key === 'Escape') {
        e.preventDefault();
        closeDialog(dialog.id, false);
      }
    };
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [dialog]);

  return (
    <>
      {loading && (
        <div className={styles.overlay} role="alertdialog" aria-modal="true" aria-busy="true" aria-label="Please wait">
          <div className={`${styles.modal} ${styles.waiting}`}>
            <Loader2 size={44} className={styles.spinner} />
            <h3 className={styles.title}>Please wait</h3>
            <p className={styles.message}>Processing your request...</p>
          </div>
        </div>
      )}

      {dialog && (
        <DialogBox key={dialog.id} dialog={dialog} primaryRef={primaryRef} />
      )}
    </>
  );
};

const DialogBox = ({ dialog, primaryRef }) => {
  const Icon = ICONS[dialog.type];
  const isConfirm = dialog.type === 'confirm';

  return (
    <div
      className={`${styles.overlay} ${styles.dialogOverlay}`}
      onMouseDown={(e) => { if (e.target === e.currentTarget && !isConfirm) closeDialog(dialog.id, false); }}
    >
      <div
        className={`${styles.modal} ${styles[dialog.type]}`}
        role={isConfirm ? 'alertdialog' : 'dialog'}
        aria-modal="true"
        aria-labelledby={`feedback-title-${dialog.id}`}
      >
        <div className={styles.iconWrap}>
          <Icon size={40} />
        </div>
        <h3 id={`feedback-title-${dialog.id}`} className={styles.title}>{dialog.title}</h3>
        {dialog.message && <p className={styles.message}>{dialog.message}</p>}

        <div className={styles.actions}>
          {isConfirm ? (
            <>
              <button className={styles.secondaryBtn} onClick={() => closeDialog(dialog.id, false)}>
                {dialog.cancelText}
              </button>
              <button
                ref={primaryRef}
                className={`${styles.primaryBtn} ${dialog.danger ? styles.dangerBtn : ''}`}
                onClick={() => closeDialog(dialog.id, true)}
              >
                {dialog.confirmText}
              </button>
            </>
          ) : (
            <button ref={primaryRef} className={styles.primaryBtn} onClick={() => closeDialog(dialog.id, true)}>
              OK
            </button>
          )}
        </div>
      </div>
    </div>
  );
};

export default FeedbackModal;
