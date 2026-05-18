
export interface RicosDocument {
    documentStyle: {};
    nodes: RicosNode[];
}


export interface RicosNode {
    id: string;
    nodes: RicosNode[];
    type: string;
    style?: {};
    textData?: {
        decorations: any[],
        text: string;
    };
    fileData?: {
        name: string;
        size: number;
        sizeInKb: string;
        src: {
            id: string;
            private: boolean;
        }
        type: string;
    };
    imageData?: {
        containerData: {},
        image: {
            src: {
                id: string;
            }
        }
    }
}