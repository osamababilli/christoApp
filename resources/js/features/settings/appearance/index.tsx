import { ContentSection } from '../components/content-section';
import { AppearanceForm } from './appearance-form';

export function SettingsAppearance() {
    return (
        <ContentSection title="المظهر" desc="تخصيص مظهر النظام واختيار الوضع الفاتح أو الداكن.">
            <AppearanceForm />
        </ContentSection>
    );
}
