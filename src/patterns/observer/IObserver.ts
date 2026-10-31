export interface IObserver<T> { update(event: T): void; }
export interface ISubject<T> { attach(observer: IObserver<T>): void; detach(observer: IObserver<T>): void; notify(event: T): void; }
