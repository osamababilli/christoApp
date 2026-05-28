import { Categories } from '@/features/categories';

type Props = { categories: Array<{ id: number; name: string; icon: string | null; color: string | null }> };

export default function SettingsCategoriesPage({ categories }: Props) {
    return <Categories categories={categories} />;
}
