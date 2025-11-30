export interface InterfaceUser {
    id: string;
    googleId?: string | null;
    email: string;
    name?: string | null;
    picture?: string | null | undefined;
    roles: string[];
    createdAt?: Date;
    updatedAt?: Date;
    lastLogin?: Date;
    password?: string | null;
    comando_geral: string[];
    comando_squad: string | null | undefined;
    classe: string | undefined;
    data_admissao_gost: string | undefined;
    patent: "comando" | "comando_squad" | "soldado" | "sub_comando" | "recruta" | "organizacao" | "interessado" | undefined;
    active: boolean;
    is_comandante_squad: boolean;
    nome_squad_subordinado: string | null;
    nome_guerra: string | null;
    id_squad_subordinado: string | null;
}