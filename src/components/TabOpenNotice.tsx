import { InfoIcon } from "./Icons";

export function TabOpenNotice() {
  return (
    <div className="bg-notice text-notice-fg">
      <p className="mx-auto flex max-w-xl items-start gap-2 px-4 py-2 text-xs leading-relaxed">
        <InfoIcon className="mt-0.5 size-4 shrink-0" />
        音と通知は、このタブを開いている間だけ届きます。タブやブラウザを閉じると鳴りません。
      </p>
    </div>
  );
}
