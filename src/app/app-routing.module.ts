import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { CreateBidComponent } from './create-bid/create-bid.component';
import { CreateTxComponent } from './create-tx/create-tx.component';
import { HomeComponent } from './home/home.component';

const routes: Routes = [
  { path: '', pathMatch: 'full', component: HomeComponent },
  { path: 'create-bid', pathMatch: 'full', component: CreateBidComponent },
  { path: 'create-tx', pathMatch: 'full', component: CreateTxComponent },
];

@NgModule({
  imports: [RouterModule.forRoot(routes)],
  exports: [RouterModule],
})
export class AppRoutingModule {}
