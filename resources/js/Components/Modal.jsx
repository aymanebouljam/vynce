import { Dialog, DialogPanel, Portal, Transition, TransitionChild } from '@headlessui/react';

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

    return (
        <Transition show={show} leave="duration-200">
            <Portal>
                <Dialog as="div" id="modal" className="relative z-50" onClose={close}>
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
                        <div className="flex min-h-full items-start justify-center sm:items-center">
                            <TransitionChild
                                enter="ease-out duration-300"
                                enterFrom="opacity-0 translate-y-4 sm:translate-y-0 sm:scale-95"
                                enterTo="opacity-100 translate-y-0 sm:scale-100"
                                leave="ease-in duration-200"
                                leaveFrom="opacity-100 translate-y-0 sm:scale-100"
                                leaveTo="opacity-0 translate-y-4 sm:translate-y-0 sm:scale-95"
                            >
                                <DialogPanel
                                    className={`app-panel app-scrollbar-hidden my-auto max-h-[min(92vh,48rem)] w-full overflow-y-auto rounded-[28px] transition-all ${maxWidthClass}`}
                                >
                                    {children}
                                </DialogPanel>
                            </TransitionChild>
                        </div>
                    </div>
                </Dialog>
            </Portal>
        </Transition>
    );
}
