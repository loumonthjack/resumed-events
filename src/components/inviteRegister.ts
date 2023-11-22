const getElement = <T extends Element>(selector: string): T | null =>
    document.querySelector(selector);

const hideElement = (selector: string) => {
    const element = getElement<HTMLElement>(selector);
    if (element) {
        element.style.display = "none";
    }
};

const inviteRegistration = () => {
    const urlSearchParams = new URLSearchParams(window.location.search);
    const { read_only: readOnlyEmail } = Object.fromEntries(urlSearchParams.entries());

    if (!readOnlyEmail) return;

    const emailInput = getElement<HTMLInputElement>("#email");
    if (emailInput) {
        emailInput.value = readOnlyEmail;
        emailInput.readOnly = true;
    }

    hideElement("#companyName");
    hideElement("label[for='companyName']");
}

export default inviteRegistration;
