export type Service={id:number;name:string;category:string;price:number;duration:number;description:string;is_active?:boolean|number}
export type Review={id:number;name:string;rating:number;text:string;service:string}
export type PortfolioItem={id:number;title:string;category:string;image:string;services:string[];price:number;is_published?:boolean}
export type Event={id:number;title:string;category:string;date:string;time:string;location:string;price:number;total_slots:number;booked_slots:number;remaining_slots:number;image:string;featured:boolean;description:string;instructor:string}
export type Booking={id:number;name:string;phone:string;date:string;time:string;services:string[];total:number;referral?:string;status:string;assigned_to?:string|null}
