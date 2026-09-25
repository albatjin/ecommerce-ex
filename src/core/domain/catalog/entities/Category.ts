import { Entity } from '../../shared/Entity';
import { Result, ok, fail } from '../../shared/Result';
import { DomainError } from '../../shared/AppError';

export interface CategoryProps {
  name: string;
  slug: string;
  parentId?: string | null;
  depth: number;
  sortOrder: number;
  isActive: boolean;
  createdAt: Date;
}

export interface UpdateCategoryDTO {
  name?: string;
  slug?: string;
  parentId?: string | null;
  depth?: number;
  sortOrder?: number;
  isActive?: boolean;
}

/**
 * 카테고리 계층형 도메인 엔티티 (대/중/소분류)
 */
export class Category extends Entity<CategoryProps> {
  private constructor(props: CategoryProps, id?: string) {
    super(props, id);
  }

  get name(): string { return this.props.name; }
  get slug(): string { return this.props.slug; }
  get parentId(): string | null | undefined { return this.props.parentId; }
  get depth(): number { return this.props.depth; }
  get sortOrder(): number { return this.props.sortOrder; }
  get isActive(): boolean { return this.props.isActive; }
  get createdAt(): Date { return this.props.createdAt; }

  public isRoot(): boolean {
    return !this.props.parentId;
  }

  public update(dto: UpdateCategoryDTO): void {
    if (dto.name !== undefined) {
      if (!dto.name.trim()) throw new DomainError('카테고리 이름은 비어있을 수 없습니다.');
      this.props.name = dto.name.trim();
    }
    if (dto.slug !== undefined) {
      if (!dto.slug.trim()) throw new DomainError('카테고리 슬러그는 비어있을 수 없습니다.');
      this.props.slug = dto.slug.trim();
    }
    if (dto.parentId !== undefined) this.props.parentId = dto.parentId;
    if (dto.depth !== undefined) {
      if (dto.depth < 1 || dto.depth > 3) throw new DomainError('카테고리 뎁스는 1~3 사이여야 합니다.');
      this.props.depth = dto.depth;
    }
    if (dto.sortOrder !== undefined) this.props.sortOrder = dto.sortOrder;
    if (dto.isActive !== undefined) this.props.isActive = dto.isActive;
  }

  public static create(
    props: Omit<CategoryProps, 'createdAt'> & { createdAt?: Date },
    id?: string
  ): Result<Category, DomainError> {
    if (!props.name || !props.name.trim()) {
      return fail(new DomainError('카테고리 이름은 필수입니다.'));
    }
    if (!props.slug || !props.slug.trim()) {
      return fail(new DomainError('카테고리 슬러그는 필수입니다.'));
    }
    if (props.depth < 1 || props.depth > 3) {
      return fail(new DomainError('카테고리 뎁스는 1(대분류), 2(중분류), 3(소분류) 중 하나여야 합니다.'));
    }

    const category = new Category(
      {
        ...props,
        parentId: props.parentId ?? null,
        createdAt: props.createdAt ?? new Date(),
      },
      id
    );

    return ok(category);
  }
}

