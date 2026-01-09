import { Dialog, DialogPanel, Transition, TransitionChild } from '@headlessui/react';
import { createPortal } from 'react-dom';

export default function Modal({
    children,
    show = false,
    maxWidth = '2xl',
    closeable = true,
    onClose = () => {},
}) {
    const close = () => {
        if (closeable) {
            onClose();
        }
    };

    const maxWidthClass = {
        sm: 'sm:max-w-sm',
        md: 'sm:max-w-md',
        lg: 'sm:max-w-lg',
        xl: 'sm:max-w-xl',
        '2xl': 'sm:max-w-2xl',
    }[maxWidth];

    const modalContent = (
        <Transition show={show} leave="duration-200">
            <Dialog as="div" id="modal" className="fixed inset-0 isolate z-[240]" onClose={close}>
                <TransitionChild
                    enter="ease-out duration-300"
                    enterFrom="opacity-0"
                    enterTo="opacity-100"
                    leave="ease-in duration-200"
                    leaveFrom="opacity-100"
                    leaveTo="opacity-0"
                >
                    <div className="fixed inset-0 bg-[rgba(3,7,12,0.62)] backdrop-blur-sm" />
                </TransitionChild>

                <div className="fixed inset-0 overflow-y-auto px-4 py-4 sm:px-6 sm:py-6">
                    <div className="flex min-h-full items-start justify-center">
                        <TransitionChild
                            enter="ease-out duration-300"
                            enterFrom="opacity-0 translate-y-4 sm:translate-y-0 sm:scale-95"
                            enterTo="opacity-100 translate-y-0 sm:scale-100"
                            leave="ease-in duration-200"
                            leaveFrom="opacity-100 translate-y-0 sm:scale-100"
                            leaveTo="opacity-0 translate-y-4 sm:translate-y-0 sm:scale-95"
                        >
                            <DialogPanel
                                className={`app-panel my-auto w-full overflow-visible rounded-[28px] transition-all sm:my-8 ${maxWidthClass}`}
                            >
                                {children}
                            </DialogPanel>
                        </TransitionChild>
                    </div>
                </div>
            </Dialog>
        </Transition>
    );

    if (typeof document === 'undefined') {
        return null;
    }

    return createPortal(modalContent, document.body);
}
