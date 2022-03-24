import React from 'react';

function PostData() {
    // if you want to submit the form, you need call this function
    const btnRef = React.useRef<HTMLButtonElement>(null);
    btnRef.current?.click(); //triggiring self click when function is called
    const decryptedURLparams = new URLSearchParams(decryptedURL); //creating new URLsearchParams to allow searching the URL

    return (
        // replace url with destination url
        <form action="thankyou.php" method="POST">
            <input type="hidden" name="secret" value={secret} />
            <input
                type="hidden"
                name="recipient"
                value={searchParams.get('recipient') || decryptedURLparams.get('amount') || 'no recipient passed'}
            />
            <input type="hidden" name="recipient1" value={recipient1} />
            <input type="hidden" name="percent" value={percent} />
            <input type="hidden" name="percent1" value={percent1} />
            <input type="hidden" name="amount" value={Number(amount)} />
            <input type="hidden" name="label" value={label} />
            <input type="hidden" name="memo" value={memo} />
            <input type="hidden" name="message" value={message} />
            <input
                type="hidden"
                name="reference"
                value={searchParams.get('reference') || decryptedURLparams.get('amount') || 'no reference passed'}
            />
            <input type="hidden" name="referenceNew" value={referenceNew} />
            <input type="hidden" name="spltokenNew" value={spltokenNew} />
            <button type="submit" ref={btnRef} hidden />
        </form>
    );
}

export default PostData;
