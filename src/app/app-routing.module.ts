import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { CreateBidComponent } from './create-bid/create-bid.component';
import { HomeComponent } from './home/home.component';

const routes: Routes = [
  { path: '', pathMatch: 'full', component: HomeComponent },
  { path: 'create-bid', pathMatch: 'full', component: CreateBidComponent }
];

@NgModule({
  imports: [RouterModule.forRoot(routes)],
  exports: [RouterModule]
})
export class AppRoutingModule {}
