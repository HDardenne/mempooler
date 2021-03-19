import { APP_INITIALIZER, NgModule } from '@angular/core';
import { BrowserModule } from '@angular/platform-browser';

import { AppRoutingModule } from './app-routing.module';
import { AppComponent } from './app.component';
import { HomeComponent } from './home/home.component';

import { HttpClientModule } from '@angular/common/http';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { HeaderComponent } from './header/header.component';
import { CreateBidComponent } from './create-bid/create-bid.component';
import { MempoolerService } from './mempooler/mempooler.service';
import { ModalComponent } from './modal/modal.component';

export function toto(mempoolerService: MempoolerService) {
  return () => mempoolerService.init();
}

@NgModule({
  declarations: [
    AppComponent,
    HomeComponent,
    HeaderComponent,
    CreateBidComponent,
    ModalComponent
  ],
  imports: [
    BrowserModule,
    AppRoutingModule,
    HttpClientModule,
    FormsModule,
    ReactiveFormsModule
  ],
  providers: [
    {
      provide: APP_INITIALIZER,
      useFactory: toto,
      deps: [MempoolerService],
      multi: true
    }
  ],
  bootstrap: [AppComponent]
})
export class AppModule {}
