import { ContentSection } from '../components/content-section';
import { ProfileForm } from './profile-form';

export function SettingsProfile() {
    return (
        <ContentSection title="الملف الشخصي" desc="تعديل بياناتك الشخصية وكلمة المرور.">
            <ProfileForm />
        </ContentSection>
    );
}
