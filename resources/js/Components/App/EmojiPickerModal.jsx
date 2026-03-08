import Modal from '@/Components/Modal';
import SecondaryButton from '@/Components/SecondaryButton';
import { MESSAGE_EMOJIS } from '@/utils/messageEmojis';

export default function EmojiPickerModal({
    show,
    onClose,
    onSelect,
    title = 'Pick an emoji',
    description = 'Add a little personality to your message.',
}) {
    return (
        <Modal show={show} onClose={onClose} maxWidth="md" centered>
            <div className="space-y-4 p-5 2xl:space-y-5 2xl:p-6">
                <div>
                    <div className="text-base font-semibold 2xl:text-lg">{title}</div>
                    <p className="app-text-soft mt-2 text-[13px] leading-5 2xl:text-sm 2xl:leading-6">
                        {description}
                    </p>
                </div>

                <div className="grid grid-cols-6 gap-2">
                    {MESSAGE_EMOJIS.map((emoji) => (
                        <button
                            key={emoji}
                            type="button"
                            onClick={() => {
                                onSelect(emoji);
                                onClose();
                            }}
                            className="app-button-secondary inline-flex h-11 items-center justify-center rounded-2xl text-xl transition hover:scale-105"
                            aria-label={`Insert ${emoji}`}
                        >
                            {emoji}
                        </button>
                    ))}
                </div>

                <div className="flex justify-end">
                    <SecondaryButton
                        type="button"
                        onClick={onClose}
                        className="rounded-full px-4 py-2 text-sm normal-case tracking-normal"
                    >
                        Close
                    </SecondaryButton>
                </div>
            </div>
        </Modal>
    );
}
